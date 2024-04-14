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

import { IDifferencer, IDiff } from './types'
import { Empty, EmptyDiffs } from './emptyDiffs'
import IdentityDifferencer from './identity'
import { ForwardReverse, HasKey } from './util'
import { KeyDifferencer, KeysDiff } from "./keys";

export function MapDiff<K, V, TValueDiff extends IDiff> (
    inserts: Map<K, V>,
    updates: Map<K, TValueDiff>,
    deletes: Map<K, V>,
    keys: KeysDiff<K>
): TMapDiff<K, V, TValueDiff> {
    return { inserts, updates, deletes, keys, isEmpty: false }
}

export type TMapDiff<K, V, TValueDiff extends IDiff> = {
    readonly inserts: Map<K, V>
    readonly updates: Map<K, TValueDiff>
    readonly deletes: Map<K, V>
    readonly keys: KeysDiff<K>
    readonly isEmpty: false
}

export type TOptions<T, TValueDiff extends IDiff> = {
    differencers?: {
        primary?: IDifferencer<T[keyof T], TValueDiff>
        overrides?: TFieldDifferencers<T, TValueDiff>
    }
    overwriteExisting?: boolean
}

export default class ObjectDifferencer<
    T extends object,
    TValueDiff extends IDiff = IDiff
> implements IDifferencer<T, TDiff<T, TValueDiff>>
{
    private readonly primary: IDifferencer<T[keyof T], TValueDiff>
    private readonly overrides: TFieldDifferencers<T, TValueDiff>
    private readonly keyDifferencer: KeyDifferencer<keyof T>
    private readonly overWriteExisting: boolean

    constructor(options?: TOptions<T, TValueDiff>) {
        this.primary =
            options?.differencers?.primary ??
            ObjectDifferencer.DefaultDifferencer<T[keyof T], TValueDiff>()

        this.overrides = {}
        const overridesOptions = options?.differencers?.overrides
        if (overridesOptions) {
            Object.assign(this.overrides, overridesOptions)
        }

        this.keyDifferencer = new KeyDifferencer()

        this.overWriteExisting = Boolean(options?.overwriteExisting ?? true)
    }

    applyDiff(current: T, diff: TDiff<T, TValueDiff>) {
        const { overWriteExisting } = this

        if (diff.isEmpty === true) {
            return current
        }

        const newKeys = this.keyDifferencer.applyDiff(
            Object.keys(current) as (keyof T)[],
            diff.keys,
        )

        const { inserts, updates } = diff
        const insertKeys = Array.from(inserts.keys())
        const updateKeys = Array.from(updates.keys())

        // @ts-expect-error Missing properties are added below
        const updated: T = {}

        let nextInsert = 0
        const lastInsert = insertKeys.length - 1
        let nextUpdate = 0
        const lastUpdate = updateKeys.length - 1
        newKeys.forEach(k => {
            if (nextInsert <= lastInsert && k === insertKeys[nextInsert]) {
                if (overWriteExisting || !HasKey(current, k)) {
                    updated[k] = inserts.get(k)
                } else {
                    updated[k] = current[k]
                }
                nextInsert++;
            } else if (nextUpdate <= lastUpdate && k === updateKeys[nextUpdate]) {
                if (HasKey(current, k)) {
                    updated[k] = this.$(k).applyDiff(current[k]!, updates.get(k))
                }
                nextUpdate++;
            } else {
                updated[k] = current[k]
            }
        })

        diff.deletes.forEach((deleteV, k) => {
            if (
                !overWriteExisting &&
                HasKey(current, k) &&
                !this.$(k).calculateDiffs(deleteV, current[k]!).forward.isEmpty
            ) {
                updated[k] = current[k]
            }
        })

        return updated
    }

    calculateDiffs(from: T, to: T) {
        const inserts = new Map<keyof T, T[keyof T]>()
        const updates = new Map<keyof T, TValueDiff>()
        const reverseUpdates = new Map<keyof T, TValueDiff>()
        const deletes = new Map<keyof T, T[keyof T]>()

        Object.entries(from).forEach((entry) => {
            const [k, fromV] = entry as [keyof T, T[keyof T]]
            if (HasKey(to, k)) {
                const toV = to[k]!
                const diffs = this.$(k).calculateDiffs(fromV, toV)

                if (!diffs.forward.isEmpty) {
                    updates.set(k, diffs.forward)
                }

                if (!diffs.reverse.isEmpty) {
                    reverseUpdates.set(k, diffs.reverse)
                }
            } else {
                deletes.set(k, fromV)
            }
        })

        Object.entries(to).forEach((entry) => {
            const [k, toV] = entry as [keyof T, T[keyof T]]
            if (!HasKey(from, k)) {
                inserts.set(k, toV)
            }
        })

        if (inserts.size <= 0 && updates.size <= 0 && deletes.size <= 0) {
            return EmptyDiffs
        }

        const keyDiffs = this.keyDifferencer.calculateDiffs(
            Object.keys(from) as (keyof T)[],
            Object.keys(to) as (keyof T)[]
        )

        return ForwardReverse(
            MapDiff(inserts, updates, deletes, keyDiffs.forward),
            MapDiff(deletes, reverseUpdates, inserts, keyDiffs.reverse)
        )
    }

    diffsIntersect(
        diffA: TDiff<T, TValueDiff>,
        diffB: TDiff<T, TValueDiff>
    ) {
        if (diffA.isEmpty === true || diffB.isEmpty === true) {
            return false
        }

        const updatesIntersect = Array.from(diffA.updates.entries())
            .some(([key, diffA]) =>
                diffB.updates.has(key) &&
                this.$(key).diffsIntersect(diffA, diffB.updates.get(key)!)
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
            diff: TMapDiff<keyof T, T[keyof T], TValueDiff>,
            keys: IterableIterator<keyof T>
        ) {
            return Array.from(keys).some(
                k => diff.inserts.has(k) ||
                     diff.updates.has(k) ||
                     diff.deletes.has(k)
            )
        }
    }

    private $ (k: keyof T) {
        return this.overrides[k] ?? this.primary
    }

    private static DefaultDifferencer<
        V,
        TValueDiff extends IDiff
    >() {
        // @ts-expect-error okay to use IdentityDifferencer here
        return new IdentityDifferencer() as IDifferencer<V, TValueDiff>
    }
}

type TDiff<T, TValueDiff extends IDiff> =
    | TMapDiff<keyof T, T[keyof T], TValueDiff>
    | typeof Empty

export type TFieldDifferencers<
    T,
    TValueDiff extends IDiff
> = {
    [k in keyof T]?: IDifferencer<T[k], TValueDiff>
}
