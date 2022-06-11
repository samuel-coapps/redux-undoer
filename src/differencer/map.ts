import { TMapDiff, MapDiff } from './object'
import { IDiff, IDifferencer } from './types'
import { Empty, EmptyDiffs } from './emptyDiffs'
import IdentityDifferencer from './identity'
import { ForwardReverse } from './util'

export class MapDifferencer<K, V, VDiff extends IDiff = IDiff>
    implements IDifferencer<Map<K, V>, TDiff<K, V, VDiff>>
{
    private readonly differencer: IDifferencer<V, VDiff>

    constructor(differencer?: IDifferencer<V, IDiff>) {
        // @ts-ignore
        this.differencer = differencer ?? new IdentityDifferencer()
    }

    applyDiff(value: Map<K, V>, diff: TDiff<K, V, VDiff>) {
        if (diff.isEmpty === true) {
            return value
        }

        const updated = new Map<K, V>()

        value.forEach((v, k) => {
            if (diff.updates.has(k)) {
                const vDiff = diff.updates.get(k)
                const vNew = this.differencer.applyDiff(v, vDiff)
                updated.set(k, vNew)
            } else if (!diff.deletes.has(k)) {
                updated.set(k, v)
            }
        })

        diff.inserts.forEach((v, k) => {
            updated.set(k, v)
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

        if (
            inserts.size === 0 &&
            deletes.size === 0 &&
            forwardUpdates.size === 0
        ) {
            return EmptyDiffs
        }

        return ForwardReverse(
            MapDiff(inserts, forwardUpdates, deletes),
            MapDiff(deletes, reverseUpdates, inserts)
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
            KeysAreChanged(diffB, diffA.deletes.keys())

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
