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
import { TMapDiff, MapDiff } from './object'
import { IDiff, IDifferencer } from './types'
import { Empty, EmptyDiffs } from './emptyDiffs'
import IdentityDifferencer from './identity'
import {ForwardReverse, HasKey} from './util'
import {KeyDifferencer} from "./keys";

export class MapDifferencer<K, V, VDiff extends IDiff = IDiff>
    implements IDifferencer<Map<K, V>, TDiff<K, V, VDiff>>
{
    private readonly differencer: IDifferencer<V, VDiff>
    private readonly keyDifferencer: KeyDifferencer<K>

    constructor(differencer?: IDifferencer<V, IDiff>) {
        // @ts-ignore
        this.differencer = differencer ?? new IdentityDifferencer()

        this.keyDifferencer = new KeyDifferencer<K>()
    }

    applyDiff(value: Map<K, V>, diff: TDiff<K, V, VDiff>) {
        if (diff.isEmpty === true) {
            return value
        }

        const newKeys = this.keyDifferencer.applyDiff(
            Array.from(value.keys()),
            diff.keys,
        )

        const { inserts, updates } = diff
        const insertKeys = Array.from(inserts.keys())
        const updateKeys = Array.from(updates.keys())

        const updated = new Map<K, V>()

        let nextInsert = 0
        const lastInsert = insertKeys.length - 1
        let nextUpdate = 0
        const lastUpdate = updateKeys.length - 1
        newKeys.forEach(k => {
            if (nextInsert <= lastInsert && k === insertKeys[nextInsert]) {
                updated.set(k, inserts.get(k))
                nextInsert++;
            } else if (nextUpdate <= lastUpdate && k === updateKeys[nextUpdate]) {
                const v = value.get(k)
                const vDiff = diff.updates.get(k)
                const vNew = this.differencer.applyDiff(v, vDiff)
                updated.set(k, vNew)
                nextUpdate++;
            } else {
                updated.set(k, value.get(k))
            }
        })

        return updated
    }

    calculateDiffs(from: Map<K, V>, to: Map<K, V>) {
        const inserts = new Map<K, V>()
        const forwardUpdates = new Map<K, VDiff>()
        const reverseUpdates = new Map<K, VDiff>()
        const deletes = new Map<K, V>()

        from.forEach((v, k) => {
            if (to.has(k)) {
                const diffs = this.differencer.calculateDiffs(v, to.get(k))

                if (!diffs.forward.isEmpty) {
                    forwardUpdates.set(k, diffs.forward)
                    reverseUpdates.set(k, diffs.reverse)
                }
            } else {
                deletes.set(k, v)
            }
        })

        to.forEach((v, k) => {
            if (!from.has(k)) {
                inserts.set(k, v)
            }
        })

        const keyDiffs = this.keyDifferencer.calculateDiffs(
            Array.from(from.keys()),
            Array.from(to.keys())
        )

        if (
            inserts.size === 0 &&
            deletes.size === 0 &&
            forwardUpdates.size === 0 &&
            keyDiffs.forward.isEmpty
        ) {
            return EmptyDiffs
        }

        return ForwardReverse(
            MapDiff(inserts, forwardUpdates, deletes, keyDiffs.forward),
            MapDiff(deletes, reverseUpdates, inserts, keyDiffs.reverse)
        )
    }

    diffsIntersect(diffA: TDiff<K, V, VDiff>, diffB: TDiff<K, V, VDiff>) {
        if (diffA.isEmpty === true || diffB.isEmpty === true) {
            return false
        }

        const updatesIntersect = Array.from(diffA.updates.entries())
            .some(([key, diffA]) =>
                diffB.updates.has(key) &&
                this.differencer.diffsIntersect(diffA, diffB.updates.get(key)!)
            )
        if (updatesIntersect) {
            return true
        }

        return KeysAreChanged(diffA, diffB.inserts.keys()) ||
            KeysAreChanged(diffA, diffB.deletes.keys()) ||
            KeysAreChanged(diffB, diffA.inserts.keys()) ||
            KeysAreChanged(diffB, diffA.deletes.keys()) ||
            this.keyDifferencer.diffsIntersect(diffA.keys, diffB.keys)

        function KeysAreChanged (
            diff: TMapDiff<K, V, VDiff>,
            keys: IterableIterator<K>
        ) {
            return Array.from(keys).some(
                k => diff.inserts.has(k) ||
                    diff.updates.has(k) ||
                    diff.deletes.has(k)
            )
        }
    }
}

type TDiff<K, V, VDiff extends IDiff> =
    | TMapDiff<K, V, VDiff>
    | typeof Empty
