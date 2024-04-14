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
import { SetDifferencer } from './set'
import { Empty, EmptyDiffs } from './emptyDiffs'
import { ForwardReverse, KeyDiff, KeyDiffReverse } from './util'

describe('SetDifferencer', () => {
    const D = new SetDifferencer<number>()

    test('applyDiff', () => {
        expect(D.applyDiff(new Set(), Empty)).toStrictEqual(new Set())
        expect(D.applyDiff(new Set([0]), Empty)).toStrictEqual(new Set([0]))

        expect(D.applyDiff(
            new Set([0]),
            KeyDiff([0], [0, 1])
        )).toStrictEqual(new Set([0, 1]))

        expect(D.applyDiff(
            new Set([0, 1]),
            KeyDiff([0, 1], [0])
        )).toStrictEqual(new Set([0]))

        expect(D.applyDiff(
            new Set([0]),
            KeyDiff([0], [1])
        )).toStrictEqual(new Set([1]))
    })

    test('calculateDiffs', () => {
        expect(D.calculateDiffs(new Set(), new Set())).toStrictEqual(
            EmptyDiffs
        )
        expect(D.calculateDiffs(new Set([0]), new Set([0]))).toStrictEqual(
            EmptyDiffs
        )

        expect(D.calculateDiffs(new Set(), new Set([0]))).toStrictEqual(
            ForwardReverse(
                KeyDiff([], [0]),
                KeyDiffReverse([], [0]),
            )
        )
        expect(D.calculateDiffs(new Set([0]), new Set())).toStrictEqual(
            ForwardReverse(
                KeyDiff([0], []),
                KeyDiffReverse([0], []),
            )
        )

        expect(D.calculateDiffs(new Set([0]), new Set([1]))).toStrictEqual(
            ForwardReverse(
                KeyDiff([0], [1]),
                KeyDiffReverse([0], [1]),
            )
        )
    })

    test("iteration order of set members", () => {
        const s = new Set([1, 2])
        const diff = D.calculateDiffs(s, new Set([1]))
        const recovered = D.applyDiff(new Set([1]), diff.reverse)
        expect(recovered).toEqual(s)
        expect(Array.from(recovered.entries())).toEqual(
            Array.from(s.entries())
        )

        const diff2 = D.calculateDiffs(s, new Set([2]))
        const recovered2 = D.applyDiff(new Set([2]), diff2.reverse)
        expect(recovered2).toEqual(s)
        expect(Array.from(recovered2.entries())).toEqual(
            Array.from(s.entries())
        )
    })

    test('diffsIntersect', () => {
        expect(D.diffsIntersect(Empty, Empty)).toBe(false)
        expect(
            D.diffsIntersect(Empty, KeyDiff([], [0]))
        ).toBe(false)
        expect(
            D.diffsIntersect(KeyDiff([], [0]), Empty)
        ).toBe(false)

        expect(D.diffsIntersect(
            KeyDiff([], [0]),
            KeyDiff([1], [])
        )).toBe(true)
    })
})
