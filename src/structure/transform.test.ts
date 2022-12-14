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

import TransformDifferencer, { InvertibleTransform } from './transform'
import IdentityDifferencer, { IdentityDiff } from './identity'
import { Empty } from './emptyDiffs'
import { ForwardReverse } from './util'

describe('TransformDifferencer', () => {
    const transformMock = {
        forward: jest.fn((x: number) => x + 1),
        reverse: jest.fn((x: number) => x - 1),
    }
    const transform: InvertibleTransform<number, number> = transformMock
    const D = new TransformDifferencer(transform, new IdentityDifferencer())

    test('applyDiff', () => {
        const diff = IdentityDiff(1, 2)
        expect(D.applyDiff(0, diff)).toBe(1)

        expect(transformMock.forward).toHaveBeenCalledTimes(1)
        expect(transformMock.forward).toHaveBeenCalledWith(0)
        expect(transformMock.reverse).toHaveBeenCalledTimes(1)
        expect(transformMock.reverse).toHaveBeenCalledWith(2)
    })

    test('calculateDiff', () => {
        expect(D.calculateDiffs(0, 1)).toStrictEqual(
            ForwardReverse(
                IdentityDiff(1, 2),
                IdentityDiff(2, 1),
            )
        )
        expect(transformMock.forward).toHaveBeenCalledTimes(2)
        expect(transformMock.forward).toHaveBeenNthCalledWith(1, 0)
        expect(transformMock.forward).toHaveBeenNthCalledWith(2, 1)
        expect(transformMock.reverse).not.toHaveBeenCalled()
    })

    test('diffsIntersect', () => {
        const diff1 = IdentityDiff(0, 1)
        const diff2 = IdentityDiff(1, 2)
        expect(D.diffsIntersect(Empty, Empty)).toBe(false)
        expect(D.diffsIntersect(Empty, diff1)).toBe(false)
        expect(D.diffsIntersect(diff1, Empty)).toBe(false)
        expect(D.diffsIntersect(diff1, diff2)).toBe(true)
        expect(D.diffsIntersect(diff2, diff1)).toBe(true)
    })

    afterEach(() => {
        transformMock.forward.mockClear()
        transformMock.reverse.mockClear()
    })
})
