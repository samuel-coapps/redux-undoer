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
import IdentityDifferencer, { IdentityDiff } from './identity'
import { EmptyDiffs, Empty } from './emptyDiffs'
import { ForwardReverse } from './util'

describe('IdentityDifferencer', () => {
    describe('applyDiff', () => {
        test('diff is empty', () => {
            expect(new IdentityDifferencer().applyDiff(0, Empty)).toBe(0)
        })

        test('diff is non-empty', () => {
            const diff = IdentityDiff(0, 1)
            expect(new IdentityDifferencer().applyDiff(0, diff)).toBe(1)
            // Do not require same from by default
            expect(new IdentityDifferencer().applyDiff(2, diff)).toBe(1)
        })

        test('requireSameFrom is true', () => {
            const diff = IdentityDiff(0, 1)
            const D = new IdentityDifferencer({ requireSameFrom: true })
            expect(D.applyDiff(0, diff)).toBe(1)
            expect(D.applyDiff(2, diff)).toBe(2)
        })

        test('requireSameFrom is false', () => {
            const diff = IdentityDiff(0, 1)
            const D = new IdentityDifferencer({ requireSameFrom: false })
            expect(D.applyDiff(0, diff)).toBe(1)
            expect(D.applyDiff(2, diff)).toBe(1)
        })
    })

    describe('calculateDiff', () => {
        test('diff is empty', () => {
            expect(new IdentityDifferencer().calculateDiffs(0, 0)).toBe(
                EmptyDiffs
            )
        })

        test('diff is non-empty', () => {
            expect(new IdentityDifferencer().calculateDiffs(0, 1)).toStrictEqual(
                ForwardReverse(
                    IdentityDiff(0, 1),
                    IdentityDiff(1, 0)
                ),
            )
        })
    })

    test('diffsIntersect', () => {
        const differencer = new IdentityDifferencer()
        const diff1 = IdentityDiff(0, 1)
        const diff2 = IdentityDiff(1, 2)
        expect(differencer.diffsIntersect(Empty, Empty)).toBe(false)
        expect(differencer.diffsIntersect(Empty, diff1)).toBe(false)
        expect(differencer.diffsIntersect(diff1, Empty)).toBe(false)
        expect(differencer.diffsIntersect(diff1, diff2)).toBe(true)
    })
})

test('IdentityDiff', () => {
    expect(IdentityDiff(0, 1)).toStrictEqual(
        { from: 0, to: 1, isEmpty: false }
    )
})
