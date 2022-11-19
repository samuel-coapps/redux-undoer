import { IDifferencer } from './types'
import { Empty, EmptyDiffs } from './emptyDiffs'

export const Ignore: IDifferencer<any, typeof Empty> = {
    applyDiff: ApplyDiff,
    calculateDiffs: CalculateDiff,
    diffsIntersect: DiffsIntersect
}

function ApplyDiff (value: any, diff: typeof Empty): any
function ApplyDiff (value: any) {
    return value
}

function CalculateDiff (from: any, to: any)
function CalculateDiff () {
    return EmptyDiffs
}

function DiffsIntersect (diffA: typeof Empty, diffB: typeof Empty)
function DiffsIntersect () {
    return false
}
