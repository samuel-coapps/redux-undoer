// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import { IDiff, IDifferencer } from './types'

export type InvertibleTransform<TValue, TResult> = {
    readonly forward: (value: TValue) => TResult
    readonly reverse: (value: TResult) => TValue
}

export default class TransformDifferencer<
    TValue,
    TResult,
    TDiff extends IDiff
> implements IDifferencer<TValue, TDiff>
{
    private readonly wrapped: IDifferencer<TResult, TDiff>
    private readonly transform: InvertibleTransform<TValue, TResult>

    constructor(
        transform: InvertibleTransform<TValue, TResult>,
        differencer: IDifferencer<TResult, TDiff>
    ) {
        this.wrapped = differencer
        this.transform = transform
    }

    applyDiff(value: TValue, diff: TDiff) {
        const { transform, wrapped } = this
        const transformed = transform.forward(value)
        const forwardApplied = wrapped.applyDiff(transformed, diff)
        return transform.reverse(forwardApplied)
    }

    calculateDiffs(from: TValue, to: TValue) {
        const { transform, wrapped } = this
        return wrapped.calculateDiffs(
            transform.forward(from),
            transform.forward(to)
        )
    }

    diffsIntersect(diffA: TDiff, diffB: TDiff) {
        return this.wrapped.diffsIntersect(diffA, diffB)
    }
}
