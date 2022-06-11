// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import { IDifferencer, IDiff } from './types'
import { Empty, EmptyDiffs } from './emptyDiffs'
import IdentityDifferencer from './identity'
import { ForwardReverse, HasKey } from './util'

export function MapDiff<K, V, TValueDiff extends IDiff> (
    inserts: Map<K, V>,
    updates: Map<K, TValueDiff>,
    deletes: Map<K, V>
): TMapDiff<K, V, TValueDiff> {
    return { inserts, updates, deletes, isEmpty: false }
}

export type TMapDiff<K, V, TValueDiff extends IDiff> = {
    readonly inserts: Map<K, V>
    readonly updates: Map<K, TValueDiff>
    readonly deletes: Map<K, V>
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

        this.overWriteExisting = Boolean(options?.overwriteExisting ?? true)
    }

    applyDiff(current: T, diff: TDiff<T, TValueDiff>) {
        const { overWriteExisting } = this

        if (diff.isEmpty === true) {
            return current
        }

        const updated: T = Object.assign({}, current)

        diff.inserts.forEach((insertV, k) => {
            if (overWriteExisting || !HasKey(current, k)) {
                updated[k] = insertV
            }
        })

        diff.updates.forEach((diffV, k) => {
            if (HasKey(current, k)) {
                updated[k] = this.$(k).applyDiff(current[k]!, diffV)
            }
        })

        diff.deletes.forEach((deleteV, k) => {
            if (
                overWriteExisting ||
                !HasKey(current, k) ||
                this.$(k).calculateDiffs(deleteV, current[k]!).forward.isEmpty
            ) {
                delete updated[k]
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

        return ForwardReverse(
            MapDiff(inserts, updates, deletes),
            MapDiff(deletes, reverseUpdates, inserts)
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
               KeysAreChanged(diffB, diffA.deletes.keys())

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
