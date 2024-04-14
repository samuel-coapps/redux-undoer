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
