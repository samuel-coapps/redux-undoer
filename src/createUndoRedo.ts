/**
 * Portions Copyright (c) 2022-present, Colorado Apps LLC
 * Portions Copyright (c) 2017-present, Global Strategies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Action, Middleware, Reducer } from 'redux'
import { AsyncThunkAction, ThunkDispatch } from '@reduxjs/toolkit'
import { IDiff, IDifferencer, IForwardReverse } from './structure'
import { UndoableActionGroup } from './undoableAction'
import {
    ActionList,
    ChangesStack,
    forwardApplyDiffs,
    reverseApplyDiffs
} from './util'

const ActionTypes = {
    setState: 'Undoable::action::internal::setState',
    undo: 'Undoable::action::public::undo',
    redo: 'Undoable::action::public::redo',
    clearAllChanges: 'Undoable::action::public::clearAllChanges',
}

function createUndoRedo<TState, TDiff extends IDiff>(options: {
    reducer: Reducer<TState, Action>
    differencer: IDifferencer<TState, TDiff>
    maxStoredChanges: number
}) {
    const { reducer, differencer, maxStoredChanges } = options

    const middleware: Middleware<
        ThunkDispatch<TState, any, any>,
        TState,
        ThunkDispatch<TState, any, any>
        > =
        ({ dispatch, getState }) => {
            const moveStateForward = diffs =>
                forwardApplyDiffs(differencer, getState(), diffs)
            const moveStateBack = diffs =>
                reverseApplyDiffs(differencer, getState(), diffs)

            return (next) => {
                const stack = new ChangesStack<TStackItem<IForwardReverse<TDiff>>>(maxStoredChanges)

                const pendingActionGroups = new Map<string,
                    TActionGroupInfo<TDiff>>()

                let dispatchingUndoable: TActionGroupInfo<TDiff> | undefined
                let actionBeingDiffed: any = undefined
                return (action: any) => {
                    if (UndoableActionGroup.is(action)) {
                        dispatchingUndoable = InfoForActionGroup(action)

                        try {
                            dispatchingUndoable.dispatches.forEach(
                                (a) => dispatch(a)
                            )
                        } finally {
                            dispatchingUndoable = undefined
                        }

                        return
                    }

                    const requestId: string | undefined = action?.meta?.requestId

                    // Store the requestId in /pending actions to match future
                    // fulfilled or rejected types to incomplete action groups.
                    if (
                        requestId &&
                        dispatchingUndoable?.pendingTypes.has(action?.type)
                    ) {
                        pendingActionGroups.set(requestId, dispatchingUndoable)
                    }

                    let actionUndoable = dispatchingUndoable
                    if (!actionUndoable && requestId) {
                        actionUndoable = pendingActionGroups.get(requestId)
                    }

                    // Is this an un-diffed action in the current UndoableActionGroup?
                    if (
                        actionUndoable &&
                        action !== actionBeingDiffed &&
                        typeof action?.type === 'string' &&
                        actionUndoable.remaining.notifyActionReceived(action.type)
                    ) {
                        actionBeingDiffed = action
                        const { capturedDiffs, remaining } = actionUndoable

                        try {
                            const begin: TState = getState()
                            const nextResult = next(action)
                            const end: TState = getState()
                            const diffs = differencer.calculateDiffs(begin, end)
                            capturedDiffs.push(diffs)
                            actionUndoable.actions.push(action)

                            pendingActionGroups.delete(requestId!)

                            if (remaining.isEmpty()) {
                                const mergeTarget = GetMergeTarget(
                                    actionUndoable,
                                    stack
                                )

                                const nonEmpty = capturedDiffs.filter(
                                    (diff) => !diff.forward.isEmpty
                                )
                                if (nonEmpty.length <= 0) {
                                    // no need to replay actions that caused no observed changes
                                } else if (mergeTarget) {
                                    mergeTarget.diffs =
                                        mergeTarget.diffs.concat(capturedDiffs)
                                    mergeTarget.actions = mergeTarget.actions.concat(
                                        actionUndoable.actions
                                    )
                                    mergeTarget.groupIds.add(actionUndoable.groupId)
                                    if (actionUndoable.dropTail) {
                                        stack.dropTail()
                                    }
                                } else {
                                    stack.putChange({
                                        diffs: capturedDiffs,
                                        actions: actionUndoable.actions,
                                        groupIds: new Set([actionUndoable.groupId]),
                                    })
                                }
                            }

                            return nextResult
                        } finally {
                            actionBeingDiffed = undefined
                        }
                    } else if (!dispatchingUndoable) {
                        if (action?.type === ActionTypes.undo) {
                            const { diffs, actions } = stack.undo() ?? {}
                            if (diffs) {
                                return next({
                                    type: ActionTypes.setState,
                                    payload: {
                                        restoredState: moveStateBack(diffs),
                                        undoneActions: actions
                                    },
                                })
                            }
                        } else if (action?.type === ActionTypes.redo) {
                            const { diffs, actions } = stack.redo() ?? {}
                            if (diffs) {
                                return next({
                                    type: ActionTypes.setState,
                                    payload: {
                                        restoredState: moveStateForward(diffs),
                                        redoneActions: actions
                                    },
                                })
                            }
                        }
                    }

                    if (action?.type === ActionTypes.clearAllChanges) {
                        stack.clear()
                        pendingActionGroups.clear()
                        return
                    }

                    return next(action)
                }
            }
        }

    const wrappedReducer = (state: TState | undefined, action: Action) => {
        if (action.type === ActionTypes.setState) {
            // @ts-expect-error action.payload is TState
            return action.payload.restoredState as TState
        }
        return reducer(state, action)
    }
    return { middleware, reducer: wrappedReducer }
}

function Undoable() {
    return new UndoableActionGroup()
}

function undo() {
    return { type: ActionTypes.undo }
}

function redo() {
    return { type: ActionTypes.redo }
}

function clearAllChanges() {
    return { type: ActionTypes.clearAllChanges }
}

export { Undoable, createUndoRedo, undo, redo, clearAllChanges, ActionTypes }

function InfoForActionGroup (action: UndoableActionGroup) {
    const createdActions = action.actions.map((a) => a.create())
    return {
        dispatches: createdActions.map(a => a.action),
        pendingTypes: new Set(
            createdActions
                .filter((a) => a.isAsync)
                .map((a) => a.pendingType!)
        ),
        capturedDiffs: [],
        actions: [],
        remaining: new ActionList(
            createdActions.map((a) => a.actionTypes)
        ),
        dropTail: action.dropTail,
        groupId: action.id,
        mergeGroupId: action.getMergeGroup(),
        isMergeLast: action.isMergeLast(),
    }
}

function GetMergeTarget<TDiff>(
    actionGroup: TActionGroupInfo<TDiff>,
    stack: ChangesStack<TStackItem<IForwardReverse<TDiff>>>
) {
    if (actionGroup.mergeGroupId) {
        return stack.find((item) =>
            item.groupIds.has(
                // FIXME Do we really need this?
                actionGroup?.mergeGroupId || ''
            )
        )
    } else if (actionGroup.isMergeLast) {
        return stack.peek()
    }
    return undefined
}

type TActionGroupInfo<TDiff> = {
    dispatches: (AsyncThunkAction<any, any, any> | Action)[]
    pendingTypes: Set<string>
    capturedDiffs: IForwardReverse<TDiff>[]
    actions: Action[]
    remaining: ActionList
    groupId: string
    dropTail?: boolean
    mergeGroupId?: string
    isMergeLast: boolean
}
type TStackItem<TDiff> = {
    diffs: TDiff[]
    actions: Action[]
    groupIds: Set<string>
}
