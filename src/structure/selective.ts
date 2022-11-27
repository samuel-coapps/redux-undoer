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

import { produce } from 'immer'
import { IDifferencer, IDiff, IForwardReverse } from './types'
import { Empty, EmptyDiffs } from './emptyDiffs'
import { ForwardReverse, HasKey } from './util'

interface TSelectiveDiff<
    TWhole,
    TSpec extends TSelectiveSpec<TWhole, TSpec>
> extends IDiff {
    partDiffs: TPartDiffs<TSpec>
    isEmpty: false
}

export function SelectiveDiff <
    TWhole,
    TSpec extends TSelectiveSpec<TWhole, TSpec>
> (partDiffs: TPartDiffs<TSpec>): TSelectiveDiff<TWhole, TSpec> {
    return { partDiffs, isEmpty: false }
}

export default class SelectiveDifferencer<
    TWhole,
    TSpec extends TSelectiveSpec<TWhole, TSpec>
> implements IDifferencer<TWhole, TDiff<TWhole, TSpec>>
{
    private readonly keys: (keyof TSpec)[]
    private readonly spec: TSpec

    constructor(spec: TSpec) {
        this.spec = spec
        this.keys = Object.keys(spec) as (keyof TSpec)[]
    }

    applyDiff(value: TWhole, diff: TDiff<TWhole, TSpec>): TWhole {
        if (diff.isEmpty === true) {
            return value
        }
        const { spec } = this

        return produce(value, (mutable) => {
            Object.entries(diff.partDiffs).forEach((entry) => {
                const [key, diff] = entry as [keyof TSpec, IDiff]
                const { get, set, differencer } = spec[key]
                const updated = differencer.applyDiff(get(value), diff)
                set(mutable as TWhole, updated)
            })
        })
    }

    calculateDiffs(
        from: TWhole,
        to: TWhole
    ): IForwardReverse<TDiff<TWhole, TSpec>> {
        const { keys, spec } = this

        let somePartDiffers = false
        const forwardParts: any = {}
        const reverseParts: any = {}

        keys.forEach((k) => {
            const { get, differencer } = spec[k]
            const partFrom = get(from)
            const partTo = get(to)

            const diffs = differencer.calculateDiffs(partFrom, partTo)
            const { forward, reverse } = diffs

            if (forward.isEmpty === false) {
                forwardParts[k] = forward
                somePartDiffers = true
            }

            if (reverse.isEmpty === false) {
                reverseParts[k] = reverse
                somePartDiffers = true
            }
        })

        if (somePartDiffers) {
            return ForwardReverse(
                SelectiveDiff(forwardParts),
                SelectiveDiff(reverseParts)
            )
        }

        return EmptyDiffs
    }

    diffsIntersect(diffA: TDiff<TWhole, TSpec>, diffB: TDiff<TWhole, TSpec>) {
        if (diffA.isEmpty === true || diffB.isEmpty === true) {
            return false
        }

        const { keys, spec } = this

        return keys.some((k) => {
            if (!HasKey(diffA.partDiffs, k) || !HasKey(diffB.partDiffs, k)) {
                return false
            }
            const partDiffA = diffA.partDiffs[k]
            const partDiffB = diffB.partDiffs[k]

            return spec[k].differencer.diffsIntersect(partDiffA, partDiffB)
        })
    }
}

export type TSelectiveSpec<TWhole, TSpec> = {
    [k in keyof TSpec]: TPartSpec<TWhole, TSpec, k>
}

type TPartSpec<TWhole, TSpec, K extends keyof TSpec> = TSpec[K] extends {
    differencer: IDifferencer<infer TPart, infer TDiff>
}
    ? IGetterSetter<TWhole, TPart> & { differencer: IDifferencer<TPart, TDiff> }
    : never

interface IGetterSetter<TWhole, TPart> {
    get(whole: TWhole): TPart
    set(whole: TWhole, part: TPart): void
}

type TPartDiffs<TSpec> = { [k in keyof TSpec]?: TPartDiff<TSpec[k]> }

type TPartDiff<TSpecPart> = TSpecPart extends {
    differencer: IDifferencer<unknown, infer TDiff>
}
    ? InferDiff<TDiff>
    : never

type InferDiff<T> = T extends IDiff ? T : never

type TDiff<TWhole, TSpec extends TSelectiveSpec<TWhole, TSpec>> =
    | TSelectiveDiff<TWhole, TSpec>
    | typeof Empty
