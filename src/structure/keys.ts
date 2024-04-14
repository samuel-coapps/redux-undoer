// Portions Copyright (c) 2024-present, Colorado Apps LLC
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

import { IDifferencer, IForwardReverse } from "./types";

type FullKeysDiff<T> = {
    isEmpty: false
    isReverse: boolean
    lengthBefore: number
    lengthAfter: number
    deletes: (T | number)[]
    blockPositions: number[]
    itemPositions: number[]
    inserts: (T | number)[]
}
export type KeysDiff<T> = { isEmpty: true } | FullKeysDiff<T>

export class KeyDifferencer <K> implements IDifferencer<K[], KeysDiff<K>> {
    applyDiff(value: K[], diff: KeysDiff<K>): K[] {
        if (!diffIsFull(diff)) {
            return value;
        }

        const restored = writeInitialWithDeletes(value, diff);
        const withDeletes = [...restored]
        writeBlocks(restored, withDeletes, diff);
        writeItems(restored, withDeletes, diff);
        applyInserts(restored, diff);
        return restored;
    }

    // NOTE This only works because we assume that the keys are unique.
    calculateDiffs(from: K[], to: K[]): IForwardReverse<KeysDiff<K>> {
        const deletes = [];
        const blockPositions = [];
        const itemPositions = [];

        const {
            index: toIndex,
            inserts,
            withInsertsRemoved: toWithNoInserts
        } = indexSharedKeys(to, new Set(from));

        let deleted = 0;
        for (let iInFrom = 0; iInFrom < from.length; iInFrom++) {
            const fromKey = from[iInFrom];
            const iInTo = toIndex.get(fromKey);
            if (iInTo === undefined) {
                deletes.push(iInFrom, fromKey);
                deleted++;
            } else if (iInTo !== iInFrom - deleted) {
                let blockElementsAfter = 0;
                const maxBlockElementsAfter = Math.min(
                    toWithNoInserts.length - iInTo - 1,
                    from.length - iInFrom - 1
                );
                while (
                    blockElementsAfter + 1 <= maxBlockElementsAfter &&
                    from[iInFrom + blockElementsAfter + 1] === toWithNoInserts[iInTo + blockElementsAfter + 1]
                ) {
                    blockElementsAfter++;
                }
                if (blockElementsAfter > 0) {
                    blockPositions.push(iInFrom - deleted, iInTo, 1 + blockElementsAfter);
                    iInFrom += blockElementsAfter;
                } else {
                    itemPositions.push(iInFrom - deleted, iInTo);
                }
            }
        }

        const isEmpty = deletes.length + inserts.length + blockPositions.length + itemPositions.length === 0;
        if (isEmpty) {
            return { forward: { isEmpty }, reverse: { isEmpty } };
        }

        const forward = {
            isEmpty: false as const,
            lengthBefore: from.length,
            lengthAfter: to.length,
            deletes,
            blockPositions,
            itemPositions,
            inserts,
            isReverse: false,
        }
        const reverse = {
            ...forward,
            lengthBefore: to.length,
            lengthAfter: from.length,
            deletes: inserts,
            inserts: deletes,
            isReverse: true,
        }

        return { forward, reverse };
    }

    diffsIntersect(diffA: KeysDiff<K>, diffB: KeysDiff<K>): boolean {
        return !diffA.isEmpty || !diffB.isEmpty
    }
}

function indexSharedKeys<K>(
    keys: K[],
    sharedWith: Set<K>
): { index: Map<K, number>, inserts: (K | number)[], withInsertsRemoved: K[] }
{
    let sharedCount = 0;
    const index = new Map<K, number>();
    const inserts = []
    const withInsertsRemoved = []
    // Be sure to enter keys into the map in the order that they appear in the array.
    for (let i = 0; i < keys.length; i++) {
        const next = keys[i];
        if (sharedWith.has(next)) {
            index.set(next, sharedCount);
            withInsertsRemoved.push(next);
            sharedCount += 1;
        } else {
            inserts.push(i, next);
        }
    }
    return { index, inserts, withInsertsRemoved };
}
function diffIsFull<K>(diff: KeysDiff<K>): diff is FullKeysDiff<K> {
    return diff.isEmpty === false;
}
function writeInitialWithDeletes<K>(value: K[], diff: FullKeysDiff<K>) {
    const { deletes, lengthBefore, lengthAfter } = diff;
    const deleted = deletes.length / 2;

    let deletesRemaining = deleted;
    let deleteIndex = 2 * (deleted - 1);
    let nextDeleteIndex = deletes[deleteIndex];
    const restored = new Array(lengthAfter)
    for (let i = lengthBefore - 1; i >= 0; i--) {
        if (i === nextDeleteIndex) {
            deleteIndex -= 2;
            nextDeleteIndex = deletes[deleteIndex];
            deletesRemaining--;
        } else {
            restored[i - deletesRemaining] = value[i];
        }
    }
    return restored
}
function writeBlocks<K>(restored: K[], value: K[], diff: FullKeysDiff<K>) {
    const { blockPositions, isReverse} = diff;
    const fromIndexOffset = isReverse ? 1 : 0;
    const toIndexOffset = isReverse ? 0 : 1;
    for (let i = 0; 3* i < blockPositions.length; i++) {
        const blockSize = blockPositions[3*i + 2];
        const fromOffset = blockPositions[3*i + fromIndexOffset];
        const toOffset = blockPositions[3*i + toIndexOffset];
        for (let j = 0; j < blockSize; j++) {
            restored[toOffset + j] = value[fromOffset + j];
        }
    }
}
function writeItems<K>(restored: K[], value: K[], diff: FullKeysDiff<K>) {
    const { itemPositions, isReverse } = diff;
    const fromIndexOffset = isReverse ? 1 : 0;
    const toIndexOffset = isReverse ? 0 : 1;
    for (let i = 0; 2 * i < itemPositions.length; i++) {
        const fromOffset = itemPositions[2*i + fromIndexOffset];
        const toOffset = itemPositions[2*i + toIndexOffset];
        restored[toOffset] = value[fromOffset]
    }
}
// Makes use of the fact that the inserts are ordered according to their appearance in the result array
function applyInserts<K>(restored: K[], diff: FullKeysDiff<K>) {
    const { inserts, lengthAfter } = diff;
    let insertsRemaining = inserts.length / 2;
    let insertIndex = 2 * (insertsRemaining - 1);
    let nextInsertIndex = inserts[insertIndex];
    for (let i = lengthAfter - 1; i >= 0; i--) {
        if (i === nextInsertIndex) {
            restored[i] = inserts[insertIndex + 1] as K
            insertsRemaining -= 1
            insertIndex -= 2;
            // Goes OOB to undefined when there are no more inserts, making the above check always false
            nextInsertIndex = inserts[insertIndex];
        } else {
            restored[i] = restored[i - insertsRemaining];
        }
    }
}
