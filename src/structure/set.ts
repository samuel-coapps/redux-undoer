// Copyright (c) 2022-present, Colorado Apps LLC
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
import { Empty, EmptyDiffs } from './emptyDiffs'
import { ForwardReverse } from './util'
import {KeyDifferencer, KeysDiff} from "./keys";


export class SetDifferencer<T> implements IDifferencer<Set<T>, TDiff<T>> {
    private readonly keysDelegate = new KeyDifferencer<T>()

    applyDiff(value: Set<T>, diff: TDiff<T>) {
        if (diff.isEmpty === true) {
            return value
        }

        return new Set(
            this.keysDelegate.applyDiff(Array.from(value), diff)
        )
    }

    calculateDiffs(from: Set<T>, to: Set<T>): IForwardReverse<TDiff<T>> {
        return this.keysDelegate.calculateDiffs(
            Array.from(from),
            Array.from(to)
        )
    }

    diffsIntersect(diffA: TDiff<T>, diffB: TDiff<T>) {
        return !diffA.isEmpty && !diffB.isEmpty &&
            this.keysDelegate.diffsIntersect(diffA, diffB)
    }
}

type TDiff<T> = KeysDiff<T>
