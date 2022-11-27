// Portions Copyright (c) 2022-present, Colorado Apps LLC
// Portions Copyright (c) 2017-present, Global Strategies
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
import ObjectDifferencer, { MapDiff } from './object'
import { EmptyDiffs, Empty } from './emptyDiffs'
import IdentityDifferencer, { IdentityDiff } from './identity'
import TransformDifferencer from './transform'
import { IDiff } from './types'
import { ForwardReverse } from './util'

describe('ObjectDifferencer', () => {
    describe('applyDiff', () => {
        test('empty diff', () => {
            const D = new ObjectDifferencer()
            expect(D.applyDiff({}, Empty)).toStrictEqual({})
            expect(D.applyDiff({ a: 0 }, Empty)).toStrictEqual({ a: 0 })
        })

        test('add a value', () => {
            const D = new ObjectDifferencer<any>()
            const diff = MapDiff(new Map([['a', 1]]), new Map(), new Map())
            expect(D.applyDiff({}, diff)).toStrictEqual({ a: 1 })
        })

        test('remove a value', () => {
            const D = new ObjectDifferencer<any>()
            const diff = MapDiff(new Map(), new Map(), new Map([['a', 1]]))
            expect(D.applyDiff({ a: 1 }, diff)).toStrictEqual({})
        })

        test('update a value', () => {
            const D = new ObjectDifferencer<any>()
            const diff = MapDiff(
                new Map(),
                new Map([['a', IdentityDiff(1, 2)]]),
                new Map()
            )
            expect(D.applyDiff({ a: 1 }, diff)).toStrictEqual({ a: 2 })
        })

        describe('diff logic configuration', () => {
            describe('overwriteExisting', () => {
                const diff = MapDiff(
                    new Map([['a', 1]]),
                    new Map(),
                    new Map([['b', 2]])
                )

                test('default', () => {
                    const D = new ObjectDifferencer<any>()
                    // Default is overwriteExisting = true
                    expect(D.applyDiff({ a: 2, b: 3 }, diff)).toStrictEqual({
                        a: 1,
                    })
                })

                test('true', () => {
                    const D = new ObjectDifferencer<any>({
                        overwriteExisting: true,
                    })
                    expect(D.applyDiff({ a: 2, b: 3 }, diff)).toStrictEqual({
                        a: 1,
                    })
                })

                test('false', () => {
                    const D = new ObjectDifferencer<any>({
                        overwriteExisting: false,
                    })
                    expect(D.applyDiff({ a: 2, b: 3 }, diff)).toStrictEqual({
                        a: 2,
                        b: 3,
                    })
                })
            })

            describe('differencers', () => {
                const t = new TransformDifferencer(
                    {
                        forward: (x: number) => `${x}`,
                        reverse: (x: string) => parseInt(x),
                    },
                    new IdentityDifferencer()
                )

                test('custom primary', () => {
                    const D = new ObjectDifferencer<TAbc>(
                        { differencers: { primary: t } }
                    )
                    const diff = MapDiff(
                        new Map(),
                        new Map([['a', IdentityDiff('1', '2')]]),
                        new Map()
                    )
                    expect(D.applyDiff({ a: 1 }, diff)).toStrictEqual({ a: 2 })
                })

                test('custom override', () => {
                    const D = new ObjectDifferencer({ differencers: {
                        overrides: { a: t }
                    } })
                    const diff = MapDiff(
                        new Map(),
                        new Map([['a', IdentityDiff('1', '2')]]),
                        new Map()
                    )
                    expect(D.applyDiff({ a: 1 }, diff)).toStrictEqual({ a: 2 })
                })
            })
        })

        test('update target is missing', () => {
            const D = new ObjectDifferencer<any>()
            const diff = MapDiff(
                new Map(),
                new Map([[0, IdentityDiff(1, 2)]]),
                new Map()
            )
            // ignore updates if the key isn't in the map being updated
            expect(D.applyDiff({}, diff)).toStrictEqual({})
        })
    })

    describe('calculateDiff', () => {
        test('empty diff', () => {
            const D = new ObjectDifferencer<any>()
            expect(D.calculateDiffs({}, {})).toBe(EmptyDiffs)
            expect(D.calculateDiffs({ a: 1 }, { a: 1 })).toBe(EmptyDiffs)
        })

        test('add a value', () => {
            const D = new ObjectDifferencer<any>()
            expect(D.calculateDiffs({}, { a: 1 })).toStrictEqual(
                ForwardReverse(
                    MapDiff(new Map([['a', 1]]), new Map(), new Map()),
                    MapDiff(new Map(), new Map(), new Map([['a', 1]]))
                )
            )
        })

        test('remove a value', () => {
            const D = new ObjectDifferencer<any>()
            expect(D.calculateDiffs({ a: 1 }, {})).toStrictEqual(
                ForwardReverse(
                    MapDiff(new Map(), new Map(), new Map([['a', 1]])),
                    MapDiff(new Map([['a', 1]]), new Map(), new Map())
                )
            )
        })

        test('update a value', () => {
            const D = new ObjectDifferencer()
            expect(D.calculateDiffs({ a: 1 }, { a: 2 })).toStrictEqual(
                ForwardReverse(
                    MapDiff(
                        new Map(),
                        new Map([['a', IdentityDiff(1, 2)]]),
                        new Map()
                    ),
                    MapDiff(
                        new Map(),
                        new Map([['a', IdentityDiff(2, 1)]]),
                        new Map()
                    )
                )
            )
        })

        describe('diff logic configuration', () => {
            describe('differencers', () => {
                const t = new TransformDifferencer(
                    {
                        forward: (x: number) => `${x}`,
                        reverse: (x: string) => parseInt(x),
                    },
                    new IdentityDifferencer()
                )

                test('custom primary', () => {
                    const D = new ObjectDifferencer<TAbc>({
                        differencers: { primary: t }
                    })
                    expect(D.calculateDiffs({ a: 1 }, { a: 2 })).toStrictEqual(
                        ForwardReverse(
                            MapDiff(
                                new Map(),
                                new Map([['a', IdentityDiff('1', '2')]]),
                                new Map()
                            ),
                            MapDiff(
                                new Map(),
                                new Map([['a', IdentityDiff('2', '1')]]),
                                new Map()
                            )
                        )
                    )
                })

                test('custom override', () => {
                    const D = new ObjectDifferencer({
                        differencers: { overrides: { a: t } }
                    })
                    expect(D.calculateDiffs({ a: 1 }, { a: 2 })).toStrictEqual(
                        ForwardReverse(
                            MapDiff(
                                new Map(),
                                new Map([['a', IdentityDiff('1', '2')]]),
                                new Map()
                            ),
                            MapDiff(
                                new Map(),
                                new Map([['a', IdentityDiff('2', '1')]]),
                                new Map()
                            )
                        )
                    )
                })
            })
        })
    })

    describe('diffsIntersect', () => {
        test('update intersection logic', () => {
            const diffs = [
                UpdateDiff([
                    ['a', UpdateDiff([['a', IdentityDiff(0, 1)]])]
                ]),
                UpdateDiff([
                    ['a', UpdateDiff([['a', IdentityDiff(1, 2)]])]
                ]),
                UpdateDiff([
                    ['a', UpdateDiff([['b', IdentityDiff(0, 1)]])]
                ]),
                UpdateDiff([
                    ['b', UpdateDiff([['a', IdentityDiff(0, 1)]])]
                ])
            ]
            const inner = new ObjectDifferencer<TAbc>()
            const D = new ObjectDifferencer<any>({
                differencers: { primary: inner }
            })

            expect(D.diffsIntersect(diffs[0], diffs[0])).toBe(true)
            expect(D.diffsIntersect(diffs[0], diffs[1])).toBe(true)
            expect(D.diffsIntersect(diffs[0], diffs[2])).toBe(false)
            expect(D.diffsIntersect(diffs[0], diffs[3])).toBe(false)

            expect(D.diffsIntersect(diffs[1], diffs[0])).toBe(true)
            expect(D.diffsIntersect(diffs[1], diffs[1])).toBe(true)
            expect(D.diffsIntersect(diffs[1], diffs[2])).toBe(false)
            expect(D.diffsIntersect(diffs[1], diffs[3])).toBe(false)

            expect(D.diffsIntersect(diffs[2], diffs[0])).toBe(false)
            expect(D.diffsIntersect(diffs[2], diffs[1])).toBe(false)
            expect(D.diffsIntersect(diffs[2], diffs[2])).toBe(true)
            expect(D.diffsIntersect(diffs[2], diffs[3])).toBe(false)

            expect(D.diffsIntersect(diffs[3], diffs[0])).toBe(false)
            expect(D.diffsIntersect(diffs[3], diffs[1])).toBe(false)
            expect(D.diffsIntersect(diffs[3], diffs[2])).toBe(false)
            expect(D.diffsIntersect(diffs[3], diffs[3])).toBe(true)
        })

        test('deletes and inserts', () => {
            const Ix0 = InsertDiff([['x', 0]])
            const Ix1 = InsertDiff([['x', 1]])
            const Iz0 = InsertDiff([['z', 0]])
            const Ux = UpdateDiff([['x', IdentityDiff(0, 1)]])
            const Uz = UpdateDiff([['z', IdentityDiff(0, 1)]])
            const Dx0 = DeleteDiff([['x', 0]])
            const Dx1 = DeleteDiff([['x', 1]])
            const Dz0 = DeleteDiff([['z', 0]])
            const differencer = new ObjectDifferencer<any>()
            
            expect(differencer.diffsIntersect(Ix0, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Iz0)).toBe(false)
            expect(differencer.diffsIntersect(Ix0, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Uz)).toBe(false)
            expect(differencer.diffsIntersect(Ix0, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Dz0)).toBe(false)

            expect(differencer.diffsIntersect(Ix1, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Iz0)).toBe(false)
            expect(differencer.diffsIntersect(Ix1, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Uz)).toBe(false)
            expect(differencer.diffsIntersect(Ix1, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Dz0)).toBe(false)

            expect(differencer.diffsIntersect(Iz0, Ix0)).toBe(false)
            expect(differencer.diffsIntersect(Iz0, Ix1)).toBe(false)
            expect(differencer.diffsIntersect(Iz0, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Ux)).toBe(false)
            expect(differencer.diffsIntersect(Iz0, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Dx0)).toBe(false)
            expect(differencer.diffsIntersect(Iz0, Dx1)).toBe(false)
            expect(differencer.diffsIntersect(Iz0, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Ux, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Iz0)).toBe(false)
            expect(differencer.diffsIntersect(Ux, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Uz)).toBe(false)
            expect(differencer.diffsIntersect(Ux, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Dz0)).toBe(false)

            expect(differencer.diffsIntersect(Uz, Ix0)).toBe(false)
            expect(differencer.diffsIntersect(Uz, Ix1)).toBe(false)
            expect(differencer.diffsIntersect(Uz, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Uz, Ux)).toBe(false)
            expect(differencer.diffsIntersect(Uz, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Uz, Dx0)).toBe(false)
            expect(differencer.diffsIntersect(Uz, Dx1)).toBe(false)
            expect(differencer.diffsIntersect(Uz, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Dx0, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Iz0)).toBe(false)
            expect(differencer.diffsIntersect(Dx0, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Uz)).toBe(false)
            expect(differencer.diffsIntersect(Dx0, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Dz0)).toBe(false)

            expect(differencer.diffsIntersect(Dx1, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Iz0)).toBe(false)
            expect(differencer.diffsIntersect(Dx1, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Uz)).toBe(false)
            expect(differencer.diffsIntersect(Dx1, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Dz0)).toBe(false)

            expect(differencer.diffsIntersect(Dz0, Ix0)).toBe(false)
            expect(differencer.diffsIntersect(Dz0, Ix1)).toBe(false)
            expect(differencer.diffsIntersect(Dz0, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Ux)).toBe(false)
            expect(differencer.diffsIntersect(Dz0, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Dx0)).toBe(false)
            expect(differencer.diffsIntersect(Dz0, Dx1)).toBe(false)
            expect(differencer.diffsIntersect(Dz0, Dz0)).toBe(true)
        })

        describe('diff logic configuration', () => {
            test('default primary', () => {
                const D = new ObjectDifferencer<TAbc>({
                    differencers: {
                        primary: new IdentityDifferencer()
                    }
                })

                const diff1 = UpdateDiff([['a', IdentityDiff(0, 1)]])
                const diff2 = UpdateDiff([['a', IdentityDiff(1, 2)]])

                expect(D.diffsIntersect(Empty, Empty)).toBe(false)
                expect(D.diffsIntersect(Empty, diff1)).toBe(false)
                expect(D.diffsIntersect(diff1, Empty)).toBe(false)
                expect(D.diffsIntersect(diff1, diff2)).toBe(true)
            })

            test('custom secondary', () => {
                const custom = {
                    diffsIntersect: jest.fn()
                }
                const D = new ObjectDifferencer({
                    differencers: {
                        primary: new IdentityDifferencer(),
                        overrides: {
                            a: custom as any
                        }
                    }
                })

                const A01 = UpdateDiff([['a', IdentityDiff(0, 1)]])
                const A12 = UpdateDiff([['a', IdentityDiff(1, 2)]])
                const B01 = UpdateDiff([['b', IdentityDiff(0, 1)]])
                const B12 = UpdateDiff([['b', IdentityDiff(1, 2)]])

                custom.diffsIntersect.mockReturnValueOnce(true)

                expect(D.diffsIntersect(A01, A12)).toBe(true)
                expect(custom.diffsIntersect).toBeCalledTimes(1)
                expect(custom.diffsIntersect).toBeCalledWith(
                    IdentityDiff(0, 1),
                    IdentityDiff(1, 2),
                )

                custom.diffsIntersect.mockClear()

                custom.diffsIntersect.mockReturnValueOnce(false)

                expect(D.diffsIntersect(A01, A12)).toBe(false)
                expect(custom.diffsIntersect).toBeCalledTimes(1)
                expect(custom.diffsIntersect).toBeCalledWith(
                    IdentityDiff(0, 1),
                    IdentityDiff(1, 2),
                )

                custom.diffsIntersect.mockClear()

                expect(D.diffsIntersect(A01, B01)).toBe(false)
                expect(D.diffsIntersect(A01, B12)).toBe(false)

                expect(D.diffsIntersect(A12, B01)).toBe(false)
                expect(D.diffsIntersect(A12, B12)).toBe(false)

                expect(D.diffsIntersect(B01, A01)).toBe(false)
                expect(D.diffsIntersect(B01, A12)).toBe(false)
                expect(D.diffsIntersect(B01, B01)).toBe(true)
                expect(D.diffsIntersect(B01, B12)).toBe(true)

                expect(D.diffsIntersect(B12, A01)).toBe(false)
                expect(D.diffsIntersect(B12, A12)).toBe(false)
                expect(D.diffsIntersect(B12, B01)).toBe(true)
                expect(D.diffsIntersect(B12, B12)).toBe(true)

                expect(custom.diffsIntersect).not.toBeCalled()
            })
        })

        function InsertDiff (inserts: [string, any][]) {
            return MapDiff(
                new Map(inserts),
                new Map(),
                new Map()
            )
        }
        function UpdateDiff<TDiff extends IDiff> (updates: [string, TDiff][]) {
            return MapDiff(
                new Map(),
                new Map(updates),
                new Map()
            )
        }
        function DeleteDiff (deletes: [string, any][]) {
            return MapDiff(
                new Map(),
                new Map(),
                new Map(deletes)
            )
        }
    })
})

test('MapDiff', () => {
    const diff = MapDiff(
        new Map([['a', 1]]),
        new Map([['b', IdentityDiff(0, 1)]]),
        new Map([['c', 1]])
    )
    expect(diff).toStrictEqual({
        inserts: new Map([['a', 1]]),
        updates: new Map([['b', IdentityDiff(0, 1)]]),
        deletes: new Map([['c', 1]]),
        isEmpty: false
    })
})

type TAbc = {
    a?: number
    b?: number
    c?: number
}
