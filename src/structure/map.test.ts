// Copyright (c) 2022-present, Colorado Apps LLC
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
import { MapDifferencer } from './map'
import { Empty, EmptyDiffs } from './emptyDiffs'
import { MapDiff } from './object'
import { IdentityDiff } from './identity'
import { SetDifferencer } from './set'
import { ForwardReverse, KeyDiff, KeyDiffReverse } from './util'
import { IDiff } from './types'

describe('MapDifferencer', () => {
    function M (...entries: any[]) {
        return new Map<any, any>(entries)
    }

    describe('applyDiff', () => {
        test('default differencer', () => {
            const D = new MapDifferencer()

            expect(D.applyDiff(M(), Empty)).toStrictEqual(M())
            expect(
                D.applyDiff(M([0, 1]), Empty)
            ).toStrictEqual(M([0, 1]))

            expect(D.applyDiff(
                M(),
                MapDiff(M([0, 1]), M(), M(), KeyDiff([], [0]))
            )).toStrictEqual(M([0, 1]))

            expect(D.applyDiff(
                M([0, 1]),
                MapDiff(M(), M([0, IdentityDiff(1, 2)]), M(), Empty)
            )).toStrictEqual(M([0, 2]))

            expect(D.applyDiff(
                M([0, 1]),
                MapDiff(M(), M(), M([0, 1]), KeyDiff([0], []))
            )).toStrictEqual(M())

            expect(D.applyDiff(
                M([0, 0], [1, 1], [2, 2]),
                MapDiff(
                    M([3, 3]),
                    M([1, IdentityDiff(1, 0)]),
                    M([2, 2]),
                    KeyDiff([0, 1, 2], [0, 1, 3])
                )
            )).toStrictEqual(M([0, 0], [1, 0], [3, 3]))
        })

        test('custom differencer', () => {
            const child = new SetDifferencer<number>()
            const D = new MapDifferencer(child)

            expect(D.applyDiff(
                M([0, new Set([0])], [1, new Set([1])]),
                MapDiff(
                    M([2, new Set([2])]),
                    M([0, KeyDiff([0], [1])]),
                    M([1, new Set([1])]),
                    KeyDiff([0, 1], [0, 2])
                )
            )).toStrictEqual(M([0, new Set([1])], [2, new Set([2])]))
        })
    })

    describe('calculateDiffs', () => {
        test('default differencer', () => {
            const D = new MapDifferencer()

            expect(D.calculateDiffs(M(), M())).toBe(EmptyDiffs)
            expect(
                D.calculateDiffs(M([0, 0]), M([0, 0]))
            ).toBe(EmptyDiffs)

            expect(
                D.calculateDiffs(M(), M([0, 0]))
            ).toStrictEqual(
                ForwardReverse(
                    MapDiff(M([0, 0]), M(), M(), KeyDiff([], [0])),
                    MapDiff(M(), M(), M([0, 0]), KeyDiffReverse([], [0])),
                )
            )

            expect(
                D.calculateDiffs(M([0, 0]), M([0, 1]))
            ).toStrictEqual(
                ForwardReverse(
                    MapDiff(M(), M([0, IdentityDiff(0, 1)]), M(), Empty),
                    MapDiff(M(), M([0, IdentityDiff(1, 0)]), M(), Empty)
                )
            )

            expect(
                D.calculateDiffs(M([0, 0]), M())
            ).toStrictEqual(
                ForwardReverse(
                    MapDiff(M(), M(), M([0, 0]), KeyDiff([0], [])),
                    MapDiff(M([0, 0]), M(), M(), KeyDiffReverse([0], []))
                )
            )

            expect(
                D.calculateDiffs(
                    M([0, 0], [1, 0], [2, 2]),
                    M([0, 0], [1, 1], [3, 3])
                )
            ).toStrictEqual(
                ForwardReverse(
                    MapDiff(
                        M([3, 3]),
                        M([1, IdentityDiff(0, 1)]),
                        M([2, 2]),
                        KeyDiff([0, 1, 2], [0, 1, 3])
                    ),
                    MapDiff(
                        M([2, 2]),
                        M([1, IdentityDiff(1, 0)]),
                        M([3, 3]),
                        KeyDiffReverse([0, 1, 2], [0, 1, 3])
                    )
                )
            )
        })

        test('custom differencer', () => {
            const child = new SetDifferencer<number>()
            const D = new MapDifferencer(child)

            expect(D.calculateDiffs(
                M([0, new Set([0])], [1, new Set([1])]),
                M([0, new Set([1])], [2, new Set([2])])
            )).toStrictEqual(
                ForwardReverse(
                    MapDiff(
                        M([2, new Set([2])]),
                        M([0, KeyDiff([0], [1])]),
                        M([1, new Set([1])]),
                        KeyDiff([0, 1], [0, 2])
                    ),
                    MapDiff(
                        M([1, new Set([1])]),
                        M([0, KeyDiffReverse([0], [1])]),
                        M([2, new Set([2])]),
                        KeyDiffReverse([0, 1], [0, 2])
                    )
                )
            )
        })
    })

    test("iteration order of map entries", () => {
        const differencer = new MapDifferencer<string, number>()
        const m = new Map([['a', 1], ['b', 2]])
        const diff = differencer.calculateDiffs(m, new Map([['b', 1]]))
        const recovered = differencer.applyDiff(new Map([['b', 1]]), diff.reverse)
        expect(recovered).toEqual(m)
        expect(Array.from(recovered.entries())).toEqual(
            Array.from(m.entries())
        )
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
            const inner = new MapDifferencer()
            const D = new MapDifferencer(inner)

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

        test('inserts and deletes', () => {
            const Ix0 = InsertDiff([['x', 0]])
            const Ix1 = InsertDiff([['x', 1]])
            const Iz0 = InsertDiff([['z', 0]])
            const Ux = UpdateDiff([['x', IdentityDiff(0, 1)]])
            const Uz = UpdateDiff([['z', IdentityDiff(0, 1)]])
            const Dx0 = DeleteDiff([['x', 0]])
            const Dx1 = DeleteDiff([['x', 1]])
            const Dz0 = DeleteDiff([['z', 0]])
            const differencer = new MapDifferencer()

            expect(differencer.diffsIntersect(Empty, Empty)).toBe(false)
            expect(differencer.diffsIntersect(Ix0, Empty)).toBe(false)
            expect(differencer.diffsIntersect(Empty, Ix0)).toBe(false)

            expect(differencer.diffsIntersect(Ix0, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Ix0, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Ix1, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Ix1, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Iz0, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Iz0, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Ux, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Uz)).toBe(false)
            expect(differencer.diffsIntersect(Ux, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Ux, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Uz, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Uz, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Uz, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Uz, Ux)).toBe(false)
            expect(differencer.diffsIntersect(Uz, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Uz, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Uz, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Uz, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Dx0, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Dx0, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Dx1, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Dx1, Dz0)).toBe(true)

            expect(differencer.diffsIntersect(Dz0, Ix0)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Ix1)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Iz0)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Ux)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Uz)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Dx0)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Dx1)).toBe(true)
            expect(differencer.diffsIntersect(Dz0, Dz0)).toBe(true)
        })

        function InsertDiff (inserts: [string, any][]) {
            return MapDiff(
                new Map(inserts),
                new Map(),
                new Map(),
                KeyDiff([], inserts.map(([k]) => k))
            )
        }
        function UpdateDiff<TDiff extends IDiff> (updates: [string, TDiff][]) {
            return MapDiff(
                new Map(),
                new Map(updates),
                new Map(),
                Empty,
            )
        }
        function DeleteDiff (deletes: [string, any][]) {
            return MapDiff(
                new Map(),
                new Map(),
                new Map(deletes),
                KeyDiff(deletes.map(([k]) => k), [])
            )
        }
    })
})
