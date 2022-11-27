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
import { SetDiff, SetDifferencer } from './set'
import { Empty, EmptyDiffs } from './emptyDiffs'
import { ForwardReverse } from './util'

describe('SetDifferencer', () => {
    const D = new SetDifferencer<number>()

    test('applyDiff', () => {
        expect(D.applyDiff(new Set(), Empty)).toStrictEqual(new Set())
        expect(D.applyDiff(new Set([0]), Empty)).toStrictEqual(new Set([0]))

        expect(D.applyDiff(
            new Set([0]),
            SetDiff(new Set([1]), new Set())
        )).toStrictEqual(new Set([0, 1]))

        expect(D.applyDiff(
            new Set([0, 1]),
            SetDiff(new Set(), new Set([1]))
        )).toStrictEqual(new Set([0]))

        expect(D.applyDiff(
            new Set([0]),
            SetDiff(new Set([1]), new Set([0]))
        )).toStrictEqual(new Set([1]))
    })

    test('calculateDiffs', () => {
        expect(D.calculateDiffs(new Set(), new Set())).toBe(EmptyDiffs)
        expect(D.calculateDiffs(new Set([0]), new Set([0]))).toBe(EmptyDiffs)

        expect(D.calculateDiffs(new Set(), new Set([0]))).toStrictEqual(
            ForwardReverse(
                SetDiff(new Set([0]), new Set()),
                SetDiff(new Set(), new Set([0]))
            )
        )
        expect(D.calculateDiffs(new Set([0]), new Set())).toStrictEqual(
            ForwardReverse(
                SetDiff(new Set(), new Set([0])),
                SetDiff(new Set([0]), new Set())
            )
        )

        expect(D.calculateDiffs(new Set([0]), new Set([1]))).toStrictEqual(
            ForwardReverse(
                SetDiff(new Set([1]), new Set([0])),
                SetDiff(new Set([0]), new Set([1]))
            )
        )
    })

    test('diffsIntersect', () => {
        expect(D.diffsIntersect(Empty, Empty)).toBe(false)
        expect(
            D.diffsIntersect(Empty, SetDiff(new Set([0]), new Set()))
        ).toBe(false)
        expect(
            D.diffsIntersect(SetDiff(new Set([0]), new Set()), Empty)
        ).toBe(false)

        expect(D.diffsIntersect(
            SetDiff(new Set([0]), new Set([])),
            SetDiff(new Set(), new Set([1]))
        )).toBe(true)
    })
})

test('SetDiff', () => {
    expect(SetDiff(new Set([0]), new Set([1]))).toStrictEqual({
        inserts: new Set([0]),
        deletes: new Set([1]),
        isEmpty: false
    })
})
