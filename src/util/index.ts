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
