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

type TSetDiff<T> = {
    inserts: Set<T>
    deletes: Set<T>
    isEmpty: false
}

export function SetDiff<T> (inserts: Set<T>, deletes: Set<T>): TSetDiff<T> {
    return { inserts, deletes, isEmpty: false }
}

export class SetDifferencer<T> implements IDifferencer<Set<T>, TDiff<T>> {
    applyDiff(value: Set<T>, diff: TDiff<T>) {
        if (diff.isEmpty === true) {
            return value
        }

        const updated = new Set<T>()
        value.forEach(e => {
            if (!diff.deletes.has(e)) {
                updated.add(e)
            }
        })

        diff.inserts.forEach(e => {
            updated.add(e)
        })

        return updated
    }

    calculateDiffs(from: Set<T>, to: Set<T>): IForwardReverse<TDiff<T>> {
        const inserts = new Set<T>()
        const deletes = new Set<T>()

        from.forEach(e => {
            if (!to.has(e)) {
                deletes.add(e)
            }
        })

        to.forEach(e => {
            if (!from.has(e)) {
                inserts.add(e)
            }
        })

        if (inserts.size === 0 && deletes.size === 0) {
            return EmptyDiffs
        }

        return ForwardReverse(
            SetDiff(inserts, deletes),
            SetDiff(deletes, inserts)
        )
    }

    diffsIntersect(diffA: TDiff<T>, diffB: TDiff<T>) {
        return !diffA.isEmpty && !diffB.isEmpty
    }
}

type TDiff<T> = TSetDiff<T> | typeof Empty
