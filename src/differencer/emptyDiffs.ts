// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import { IForwardReverse } from './types'

const Empty = { isEmpty: true } as const

const EmptyDiffs: IForwardReverse<any> = {
    forward: Empty,
    reverse: Empty
} as const

export { EmptyDiffs, Empty }
