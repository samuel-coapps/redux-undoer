// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import ChangesStack from './changesStack'
import { IDiff, IDifferencer, IForwardReverse } from '../structure'

class ActionList {
    private readonly remaining: Set<string>[]

    constructor(actionTypes: Set<string>[]) {
        this.remaining = actionTypes.slice()
    }

    notifyActionReceived(type: string) {
        const index = this.remaining.findIndex((set) => set.has(type))
        if (index < 0) {
            return false
        }

        this.remaining.splice(index, 1)
        return true
    }

    isEmpty() {
        return this.remaining.length === 0
    }
}

function forwardApplyDiffs<TState, TDiff extends IDiff>(
    differencer: IDifferencer<TState, TDiff>,
    state: TState,
    diffs: IForwardReverse<TDiff>[]
) {
    return diffs.reduce(
        (acc, diff) => differencer.applyDiff(acc, diff.forward),
        state
    )
}

function reverseApplyDiffs<TState, TDiff extends IDiff>(
    differencer: IDifferencer<TState, TDiff>,
    state: TState,
    diffs: IForwardReverse<TDiff>[]
) {
    return diffs.reduceRight(
        (acc, diff) => differencer.applyDiff(acc, diff.reverse),
        state
    )
}

export { ActionList, ChangesStack, forwardApplyDiffs, reverseApplyDiffs }
