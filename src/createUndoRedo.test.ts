// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import {
    combineReducers,
    configureStore,
    createAsyncThunk,
    createSlice,
    Store,
} from '@reduxjs/toolkit'
import {
    createUndoRedo,
    undo,
    redo,
    Undoable,
    clearAllChanges, ActionTypes,
} from './createUndoRedo'
import { Diff as D } from './structure'
import { waitFor } from './util/testUtil'

describe('createUndoMiddleware', () => {
    describe('undo/redo across two state keys', () => {
        const counter1 = CreateCounterSlice('counter1')
        const counter2 = CreateCounterSlice('counter2')
        const ignored = CreateCounterSlice('ignored')

        test('interleave counter actions', () => {
            const { store, dispatch } = CreateStore()

            dispatch(Undoable().with(counter1.increment))
            dispatch(Undoable().with(counter2.increment))
            dispatch(Undoable().with(ignored.increment))

            dispatch(Undoable().with(ignored.increment))
            dispatch(Undoable().with(counter2.increment))
            dispatch(Undoable().with(counter1.increment))

            ExpectStateToMatch(store, 2, 2)

            dispatch(undo())
            ExpectStateToMatch(store, 1, 2)

            dispatch(undo())
            ExpectStateToMatch(store, 1, 1)

            // We should skip/not undo actions for the ignored state
            dispatch(undo())
            ExpectStateToMatch(store, 1, 0)

            dispatch(undo())
            ExpectStateToMatch(store, 0, 0)

            // We are at the end of the undo stack, so another undo should have no effect.
            dispatch(undo())
            ExpectStateToMatch(store, 0, 0)

            // Now redo all the recorded changes

            dispatch(redo())
            ExpectStateToMatch(store, 1, 0)
            dispatch(redo())
            ExpectStateToMatch(store, 1, 1)
            dispatch(redo())
            ExpectStateToMatch(store, 1, 2)
            dispatch(redo())
            ExpectStateToMatch(store, 2, 2)
        })

        test('forking', () => {
            const { store, dispatch } = CreateStore()

            dispatch(Undoable().with(counter1.increment))
            dispatch(Undoable().with(counter2.increment))
            dispatch(Undoable().with(ignored.increment))

            dispatch(Undoable().with(ignored.increment))
            dispatch(Undoable().with(counter2.increment))
            dispatch(Undoable().with(counter1.increment))

            dispatch(undo())
            dispatch(undo())
            dispatch(redo())
            dispatch(undo())
            ExpectStateToMatch(store, 1, 1)

            dispatch(Undoable().with(counter1.increment))
            ExpectStateToMatch(store, 2, 1)

            // redo should have no effect after taking a new action
            dispatch(redo())
            ExpectStateToMatch(store, 2, 1)

            dispatch(undo())
            dispatch(undo())
            dispatch(undo())
            dispatch(undo())

            ExpectStateToMatch(store, 0, 0)

            dispatch(redo())
            dispatch(redo())
            dispatch(redo())
            dispatch(redo())

            ExpectStateToMatch(store, 2, 1)
        })

        describe('mergeWithLast', () => {
            test('merge succeeds', () => {
                const { store, dispatch } = CreateStore()

                const undoable = Undoable().with(counter1.increment)
                dispatch(undoable)
                dispatch(Undoable().with(ignored.increment, 2))

                dispatch(Undoable().with(counter2.increment).mergeWithLast())

                ExpectStateToMatch(store, 1, 1)
                dispatch(undo())
                ExpectStateToMatch(store, 0, 0)
                dispatch(redo())
                ExpectStateToMatch(store, 1, 1)

                dispatch(
                    Undoable()
                        .with(counter1.increment)
                        .with(counter2.increment)
                        .mergeWithLast()
                )

                ExpectStateToMatch(store, 2, 2)
                dispatch(undo())
                ExpectStateToMatch(store, 0, 0)
                dispatch(redo())
                ExpectStateToMatch(store, 2, 2)
            })

            test('no undoable to merge with', () => {
                const { store, dispatch } = CreateStore({ initialIgnored: 2 })

                dispatch(Undoable().with(counter1.increment).mergeWithLast())

                ExpectStateToMatch(store, 1, 0)
                dispatch(undo())
                ExpectStateToMatch(store, 0, 0)
                dispatch(redo())
                ExpectStateToMatch(store, 1, 0)
            })

            describe('dropTail', () => {
                test('dropTail is true', () => {
                    const { store, dispatch } = CreateStore({
                        initialIgnored: 2,
                    })

                    dispatch(Undoable().with(counter1.increment))
                    dispatch(Undoable().with(counter2.increment))
                    dispatch(undo())

                    dispatch(
                        Undoable()
                            .with(counter1.increment)
                            .mergeWithLast({ dropTail: true })
                    )

                    ExpectStateToMatch(store, 2, 0)
                    dispatch(redo())
                    ExpectStateToMatch(store, 2, 0)
                })

                test('dropTail is false', () => {
                    const { store, dispatch } = CreateStore({
                        initialIgnored: 2,
                    })

                    dispatch(Undoable().with(counter1.increment))
                    dispatch(Undoable().with(counter2.increment))
                    dispatch(undo())

                    dispatch(
                        Undoable()
                            .with(counter1.increment)
                            .mergeWithLast({ dropTail: false })
                    )

                    ExpectStateToMatch(store, 2, 0)
                    dispatch(redo())
                    ExpectStateToMatch(store, 2, 1)
                })

                test('default', () => {
                    const { store, dispatch } = CreateStore({
                        initialIgnored: 2,
                    })

                    dispatch(Undoable().with(counter1.increment))
                    dispatch(Undoable().with(counter2.increment))
                    dispatch(undo())

                    dispatch(
                        Undoable().with(counter1.increment).mergeWithLast()
                    )

                    ExpectStateToMatch(store, 2, 0)
                    dispatch(redo())
                    ExpectStateToMatch(store, 2, 1)
                })
            })
        })

        describe('mergeWithGroup', () => {
            test('merge succeeds', () => {
                const { store, dispatch } = CreateStore()

                const undoable = Undoable().with(counter1.increment)
                dispatch(undoable)
                dispatch(Undoable().with(ignored.increment, 2))

                const merge = Undoable()
                    .with(counter2.increment)
                    .mergeWithGroup(undoable)
                dispatch(merge)

                ExpectStateToMatch(store, 1, 1)
                dispatch(undo())
                ExpectStateToMatch(store, 0, 0)
                dispatch(redo())
                ExpectStateToMatch(store, 1, 1)

                dispatch(
                    Undoable()
                        .with(counter1.increment)
                        .with(counter2.increment)
                        .mergeWithGroup(merge)
                )

                ExpectStateToMatch(store, 2, 2)
                dispatch(undo())
                ExpectStateToMatch(store, 0, 0)
                dispatch(redo())
                ExpectStateToMatch(store, 2, 2)
            })

            test('merge with unknown undoable group', () => {
                const { store, dispatch } = CreateStore({ initialIgnored: 2 })

                dispatch(Undoable().with(counter1.increment))

                const unknown = Undoable().with(counter1.increment)

                dispatch(
                    Undoable().with(counter2.increment).mergeWithGroup(unknown)
                )

                ExpectStateToMatch(store, 1, 1)
                dispatch(undo())
                ExpectStateToMatch(store, 1, 0)
                dispatch(undo())
                ExpectStateToMatch(store, 0, 0)
                dispatch(redo())
                ExpectStateToMatch(store, 1, 0)
                dispatch(redo())
                ExpectStateToMatch(store, 1, 1)
            })
        })

        function CreateStore(options?: { initialIgnored: number }) {
            type TState = {
                counter1: { value: number }
                counter2: { value: number }
                ignored: { value: number }
            }

            const { middleware, reducer } = createUndoRedo<TState, any>({
                differencer: D.record<TState, any>({
                    counter1: counterDifferencer,
                    counter2: counterDifferencer,
                }),
                reducer: combineReducers({
                    counter1: counter1.slice.reducer,
                    counter2: counter2.slice.reducer,
                    ignored: ignored.slice.reducer,
                }),
                maxStoredChanges: 64,
            })

            const store = configureStore({
                reducer,
                middleware: (getDefaultMiddleware) => {
                    return [middleware].concat(getDefaultMiddleware())
                },
            })

            store.dispatch(ignored.increment(options?.initialIgnored ?? 0))

            const dispatch = (action: any) => store.dispatch(action)

            return { dispatch, store }
        }

        function ExpectStateToMatch(
            store: Store,
            counter1: number,
            counter2: number
        ) {
            expect(store.getState()).toEqual({
                counter1: { value: counter1 },
                counter2: { value: counter2 },
                // The ignored state should never change due to an undo or redo.
                ignored: { value: 2 },
            })
        }
    })

    describe('grouping actions & async', () => {
        test('two sync actions', () => {
            const { counter, store, dispatch } = CreateCounterStore()

            dispatch(Undoable().with(counter.increment).with(counter.increment))
            ExpectCounterToMatch(store, 2)

            dispatch(redo())
            ExpectCounterToMatch(store, 2)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(redo())
            ExpectCounterToMatch(store, 2)
            dispatch(redo())
            ExpectCounterToMatch(store, 2)
        })

        test('sync action -> async thunk', async () => {
            const { counter, store, dispatch } = CreateCounterStore()

            dispatch(
                Undoable().with(counter.increment).with(counter.incrementAsync)
            )
            await waitFor(() => ExpectCounterToMatch(store, 2))

            dispatch(redo())
            ExpectCounterToMatch(store, 2)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(redo())
            ExpectCounterToMatch(store, 2)
            dispatch(redo())
            ExpectCounterToMatch(store, 2)
        })

        test('async thunk -> sync action', async () => {
            const { counter, store, dispatch } = CreateCounterStore()

            dispatch(
                Undoable().with(counter.incrementAsync).with(counter.increment)
            )
            await waitFor(() => ExpectCounterToMatch(store, 2))

            dispatch(redo())
            ExpectCounterToMatch(store, 2)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(redo())
            ExpectCounterToMatch(store, 2)
            dispatch(redo())
            ExpectCounterToMatch(store, 2)
        })

        test('two async thunks', async () => {
            const { counter, store, dispatch } = CreateCounterStore()

            dispatch(
                Undoable()
                    .with(counter.incrementAsync)
                    .with(counter.incrementAsync)
            )
            await waitFor(() => ExpectCounterToMatch(store, 2))

            dispatch(redo())
            ExpectCounterToMatch(store, 2)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(redo())
            ExpectCounterToMatch(store, 2)
            dispatch(redo())
            ExpectCounterToMatch(store, 2)
        })

        test('grouped actions need to be passed arguments', async () => {
            const { counter, store, dispatch } = CreateCounterStore()

            dispatch(
                Undoable()
                    .with(counter.increment, 2)
                    .with(counter.incrementAsync, 2)
            )
            await waitFor(() => ExpectCounterToMatch(store, 4))

            dispatch(redo())
            ExpectCounterToMatch(store, 4)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(undo())
            ExpectCounterToMatch(store, 0)
            dispatch(redo())
            ExpectCounterToMatch(store, 4)
            dispatch(redo())
            ExpectCounterToMatch(store, 4)
        })

        // Interleaved async actions can be unsafe, but are still allowed
        // because they can be safe if they effect disjoint parts of the
        // state (which is what this test case is testing).
        test('interleaved async actions', async () => {
            const { counter, store, other, dispatch } = CreateCounterStore()

            // Promises to control the order in which async actions resolve
            let resolveCounter: any
            const counterPromise = new Promise((resolve) => {
                resolveCounter = resolve
            })
            let resolveOther: any
            const otherPromise = new Promise((resolve) => {
                resolveOther = resolve
            })

            dispatch(Undoable().with(counter.incrementAsync, counterPromise))
            dispatch(Undoable().with(other.incrementAsync, otherPromise))

            ExpectCounterToMatch(store, 0)
            ExpectOtherToMatch(store, 0)

            resolveOther(1)

            await waitFor(() => ExpectOtherToMatch(store, 1))
            ExpectCounterToMatch(store, 0)

            resolveCounter(1)

            await waitFor(() => ExpectCounterToMatch(store, 1))
        })

        describe('clearAllChanges', () => {
            test('changes are cleared', () => {
                const { counter, store, dispatch } = CreateCounterStore()

                dispatch(Undoable().with(counter.increment))
                dispatch(Undoable().with(counter.increment))

                ExpectCounterToMatch(store, 2)

                dispatch(clearAllChanges())

                dispatch(Undoable().with(counter.increment))

                ExpectCounterToMatch(store, 3)

                dispatch(undo())
                ExpectCounterToMatch(store, 2)
                dispatch(undo())
                ExpectCounterToMatch(store, 2)
                dispatch(redo())
                ExpectCounterToMatch(store, 3)
            })

            test('pending async action arrives after changes are cleared', async () => {
                const { counter, store, dispatch } = CreateCounterStore()

                let resolveHook: any
                const promise = new Promise((resolve) => {
                    resolveHook = resolve
                })

                dispatch(Undoable().with(counter.incrementAsync, promise))

                ExpectCounterToMatch(store, 0)

                dispatch(clearAllChanges())

                resolveHook(2)

                await waitFor(() => ExpectCounterToMatch(store, 2))

                dispatch(Undoable().with(counter.increment))

                ExpectCounterToMatch(store, 3)

                dispatch(undo())
                ExpectCounterToMatch(store, 2)
                dispatch(undo())
                ExpectCounterToMatch(store, 2)
                dispatch(redo())
                ExpectCounterToMatch(store, 3)
            })
        })

        describe('action metadata', () => {
            describe('undo actions', () => {
                test('undo 1 action', () => {
                    const { middleware, captured } = CreateObserverMiddleware()
                    const { counter, dispatch } = CreateCounterStore(
                        [middleware]
                    )

                    dispatch(Undoable().with(counter.increment))
                    dispatch(undo())

                    expect(captured.action).toMatchObject({
                        type: ActionTypes.setState,
                        payload: {
                            restoredState: {
                                counter: { value: 0 },
                                other: { value: 0 }
                            },
                            undoneActions: [counter.increment()]
                        }
                    })
                })

                test('undo 2 actions', () => {
                    const { middleware, captured } = CreateObserverMiddleware()
                    const { counter, dispatch } = CreateCounterStore(
                        [middleware]
                    )

                    dispatch(Undoable()
                        .with(counter.increment)
                        .with(counter.increment)
                    )
                    dispatch(undo())

                    expect(captured.action).toMatchObject({
                        type: ActionTypes.setState,
                        payload: {
                            restoredState: {
                                counter: { value: 0 },
                                other: { value: 0 }
                            },
                            undoneActions: [
                                counter.increment(),
                                counter.increment()
                            ]
                        }
                    })
                })
            })

            describe('redo actions', ()  => {
                test('redo 2 actions', ()  => {
                    const { middleware, captured } = CreateObserverMiddleware()
                    const { counter, dispatch } = CreateCounterStore(
                        [middleware]
                    )

                    dispatch(Undoable()
                        .with(counter.increment)
                        .with(counter.increment)
                    )
                    dispatch(undo())
                    dispatch(redo())

                    expect(captured.action).toMatchObject({
                        type: ActionTypes.setState,
                        payload: {
                            restoredState: {
                                counter: { value: 2 },
                                other: { value: 0 }
                            },
                            redoneActions: [
                                counter.increment(),
                                counter.increment()
                            ]
                        }
                    })
                })
            })

            test('merging action lists', async ()  => {
                const { middleware, captured } = CreateObserverMiddleware()
                const { counter, store, dispatch } = CreateCounterStore(
                    [middleware]
                )

                const mergeGroup = Undoable().with(counter.increment)
                dispatch(mergeGroup)

                dispatch(
                    Undoable()
                        .with(counter.increment)
                        .mergeWithGroup(mergeGroup)
                )

                dispatch(
                    Undoable()
                        .with(counter.incrementAsync)
                        .mergeWithGroup(mergeGroup)
                )
                await waitFor(() => ExpectCounterToMatch(store, 3))

                dispatch(undo())

                expect(captured.action).toMatchObject({
                    type: ActionTypes.setState,
                    payload: {
                        restoredState: {
                            counter: { value: 0 },
                            other: { value: 0 }
                        },
                        undoneActions: [
                            counter.increment(),
                            counter.increment(),
                            { type: "counter:incrementAsync/fulfilled" }
                        ]
                    }
                })

                dispatch(redo())

                expect(captured.action).toMatchObject({
                    type: ActionTypes.setState,
                    payload: {
                        restoredState: {
                            counter: { value: 3 },
                            other: { value: 0 }
                        },
                        redoneActions: [
                            counter.increment(),
                            counter.increment(),
                            { type: "counter:incrementAsync/fulfilled" }
                        ]
                    }
                })
            })

            function CreateObserverMiddleware () {
                let captured = { action: null }

                function Observer () {
                    return next => {
                        return (action: any) => {
                            captured.action = action
                            return next(action)
                        }
                    }
                }

                return { middleware: Observer, captured }
            }
        })

        function CreateCounterStore(extraMiddlewares=[]) {
            type TState = {
                counter: { value: number }
                other: { value: number }
            }
            const counter = CreateCounterSlice('counter')
            const other = CreateCounterSlice('other')
            const { middleware, reducer } = createUndoRedo({
                differencer: D.record<TState, any>({
                    counter: counterDifferencer,
                    other: counterDifferencer,
                }),
                reducer: combineReducers({
                    counter: counter.slice.reducer,
                    other: other.slice.reducer,
                }),
                maxStoredChanges: 64,
            })

            const store = configureStore({
                reducer,
                middleware: (getDefaultMiddleware) => {
                    return [middleware]
                        .concat(extraMiddlewares)
                        .concat(getDefaultMiddleware())
                },
            })

            const dispatch = (action: any) => store.dispatch(action)

            return { counter, other, store, dispatch }
        }

        function ExpectCounterToMatch(store: Store, counter: number) {
            expect(store.getState()).toMatchObject({
                counter: { value: counter },
            })
        }

        function ExpectOtherToMatch(store: Store, other: number) {
            expect(store.getState()).toMatchObject({
                other: { value: other },
            })
        }
    })
})

type TCounterState = { value: number }
function CreateCounterSlice(name: string) {
    const incrementAsync = createAsyncThunk(
        `${name}:incrementAsync`,
        async (delta?: Promise<number> | number | undefined) => {
            return delta
        }
    )

    const slice = createSlice({
        name: `${name}:counter`,
        initialState: { value: 0 },
        reducers: {
            increment(
                state: TCounterState,
                action: { payload: number | undefined }
            ) {
                state.value += action.payload ?? 1
            },
        },
        extraReducers: {
            [incrementAsync.fulfilled.toString()](
                state: TCounterState,
                action: { payload: number | undefined }
            ) {
                state.value += action.payload ?? 1
            },
        },
    })
    return { slice, incrementAsync, increment: slice.actions.increment }
}

const counterDifferencer = D.record<{ value: number }, any>({
    value: D.identity(),
})
