// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import { Diff as D } from './differencer'
import { ActionList, forwardApplyDiffs, reverseApplyDiffs } from './util'

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
