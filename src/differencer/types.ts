// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

export interface IDifferencer<TValue, TDiff extends IDiff> {
    calculateDiffs(from: TValue, to: TValue): IForwardReverse<TDiff>
    applyDiff(value: TValue, diff: TDiff): TValue
    diffsIntersect(diffA: TDiff, diffB: TDiff): boolean
}

export interface IForwardReverse<TDiff> {
    readonly forward: TDiff
    readonly reverse: TDiff
}

export interface IDiff {
    readonly isEmpty: boolean
}

export type TDifferencerValue<T> = T extends IDifferencer<infer V, any>
    ? V
    : never

export type TDifferencerDiff<T> = T extends IDifferencer<any, infer TDiff>
    ? TDiff
    : never
