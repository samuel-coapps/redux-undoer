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
import { Empty, EmptyDiffs } from './emptyDiffs'
import { Ignore } from './ignore'

describe('Ignore', () => {
    test('applyDiff', () => {
        expect(Ignore.applyDiff(0, Empty)).toBe(0)
    })

    test('calculateDiff', () => {
        expect(Ignore.calculateDiffs(0, 1)).toBe(EmptyDiffs)
    })

    test('diffsIntersect', () => {
        expect(Ignore.diffsIntersect(Empty, Empty)).toBe(false)
    })
})
