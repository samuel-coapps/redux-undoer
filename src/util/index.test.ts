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

import { Diff as D } from '../structure'
import { ActionList, forwardApplyDiffs, reverseApplyDiffs } from './index'

test('ActionList', () => {
    const list = new ActionList([
        new Set(['actionA', 'actionB']),
        new Set(['actionC']),
        new Set(['actionA', 'actionB']),
    ])

    expect(list.isEmpty()).toBe(false)
    expect(list.notifyActionReceived('unknown')).toBe(false)

    expect(list.isEmpty()).toBe(false)
    expect(list.notifyActionReceived('actionA')).toBe(true)

    expect(list.isEmpty()).toBe(false)
    expect(list.notifyActionReceived('actionC')).toBe(true)

    expect(list.isEmpty()).toBe(false)
    expect(list.notifyActionReceived('actionB')).toBe(true)

    expect(list.isEmpty()).toBe(true)

    expect(list.notifyActionReceived('unknown')).toBe(false)

    expect(list.isEmpty()).toBe(true)
})

test('ApplyDiffs', () => {
    const differencer = D.identity()
    const diffs = [
        differencer.calculateDiffs(0, 1),
        differencer.calculateDiffs(1, 2),
    ]

    expect(forwardApplyDiffs(differencer, 0, diffs)).toBe(2)
    expect(reverseApplyDiffs(differencer, 2, diffs)).toBe(0)
})
