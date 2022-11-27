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
