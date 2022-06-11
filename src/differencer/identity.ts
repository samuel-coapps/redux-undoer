// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import { IDifferencer, IForwardReverse } from './types'
import { EmptyDiffs, Empty } from './emptyDiffs'
import { ForwardReverse } from './util'

type TIdentityDiff = {
    readonly from: any
    readonly to: any
    readonly isEmpty: false
}
export function IdentityDiff (from: any, to: any): TIdentityDiff {
    return { from, to, isEmpty: false }
}

type DiffType = TIdentityDiff | typeof Empty

export type TOptions = {
    requireSameFrom: boolean
}

export default class IdentityDifferencer
    implements IDifferencer<any, DiffType>
{
    private readonly requireSameFrom: boolean

    constructor(options?: TOptions) {
        this.requireSameFrom = Boolean(options?.requireSameFrom)
    }

    applyDiff(value: any, diff: DiffType): any {
        // Using === here seems to help TS do type discrimination.
        if (diff.isEmpty === true) {
            return value
        }

        if (!this.requireSameFrom || value === diff.from) {
            return diff.to
        }
        return value
    }

    calculateDiffs(from: any, to: any): IForwardReverse<DiffType> {
        if (from === to) {
            return EmptyDiffs
        }
        return ForwardReverse(
            IdentityDiff(from, to),
            IdentityDiff(to, from)
        )
    }

    diffsIntersect (diffA: DiffType, diffB: DiffType) {
        return !diffA.isEmpty && !diffB.isEmpty
    }
}
