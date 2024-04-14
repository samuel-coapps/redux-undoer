// Copyright (c) 2017-present, Global Strategies
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

import { Action } from 'redux'
import { AsyncThunk } from '@reduxjs/toolkit'

const IS_UNDOABLE_GROUP = Symbol('Undoable::IsUndoableGroup')
const MERGE_LAST = 'Undoable::MergeLast'

class UndoableActionGroup {
    static idGenerator = IdGenerator()
    readonly type: string = `Undoable::${UndoableActionGroup.name}::actionType`
    readonly actions: UndoableAction[]
    readonly id = UndoableActionGroup.idGenerator.next().value as string
    private readonly mergeTarget?: string
    readonly dropTail?: boolean
    constructor(
        actions: UndoableAction[] = [],
        options?: { mergeTarget?: string; dropTail?: boolean }
    ) {
        this.actions = actions
        this.mergeTarget = options?.mergeTarget
        this.dropTail = options?.dropTail
        Object.defineProperty(this, IS_UNDOABLE_GROUP, { value: true })
    }

    with(actionCreator: TActionCreator, arg?: any) {
        const undoable = new UndoableAction(actionCreator, arg!)
        return new UndoableActionGroup(this.actions.concat([undoable]))
    }

    mergeWithLast(options?: { dropTail: boolean }) {
        return new UndoableActionGroup(this.actions, {
            mergeTarget: MERGE_LAST,
            dropTail: options?.dropTail,
        })
    }

    mergeWithGroup(group: UndoableActionGroup) {
        return new UndoableActionGroup(this.actions, { mergeTarget: group.id })
    }

    isMergeLast() {
        return this.mergeTarget === MERGE_LAST
    }

    getMergeGroup() {
        if (this.mergeTarget !== MERGE_LAST) {
            return this.mergeTarget
        }
        return undefined
    }

    static is(o: any): o is UndoableActionGroup {
        return o instanceof UndoableActionGroup && IS_UNDOABLE_GROUP in o
    }
}

class UndoableAction {
    readonly actionCreator: TActionCreator
    readonly arg: any
    constructor(actionCreator: TActionCreator, arg: any) {
        this.actionCreator = actionCreator
        this.arg = arg
    }

    create() {
        const { actionCreator, arg } = this

        if (isAsyncThunk(actionCreator)) {
            const action = actionCreator(arg)
            const actionTypes = new Set([
                actionCreator.fulfilled.toString(),
                actionCreator.rejected.toString(),
            ])
            const pendingType = actionCreator.pending.toString()
            return { action, actionTypes, pendingType, isAsync: true }
        } else {
            const action: Action = actionCreator(arg)
            const actionTypes = new Set([action.type])
            return { action, actionTypes, isAsync: false }
        }
    }
}

export { UndoableAction, UndoableActionGroup }

function* IdGenerator() {
    let nextId = 1
    while (true) {
        yield `Undoable::${UndoableActionGroup.name}::id::${nextId}`
        nextId += 1
    }
}

function isAsyncThunk(
    actionCreator: TActionCreator
): actionCreator is AsyncThunk<any, any, any> {
    return (
        'pending' in actionCreator &&
        typeof actionCreator.pending === 'function' &&
        typeof actionCreator.fulfilled === 'function' &&
        typeof actionCreator.rejected === 'function'
    )
}

type TActionCreator = ((arg: any) => Action) | AsyncThunk<any, any, any>
