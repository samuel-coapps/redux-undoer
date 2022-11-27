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

import { InvertibleTransform } from './transform'
import { HasKey } from './util'

export const DUPLICATE_KEY_ITEMS_STAMP =
    'Undoable::DuplicateKeyItems::91e05b93a292dc563f9d' as const

export type TDuplicatedKeyItems<T> = {
    readonly stamp: typeof DUPLICATE_KEY_ITEMS_STAMP
    readonly key: TKey
    readonly items: T[]
}

export function DuplicatedKeyItems<T> (key: TKey, items: T[]) {
    return { stamp: DUPLICATE_KEY_ITEMS_STAMP, key, items }
}

export function IsDuplicatedKeyItems (
    o: any
): o is TDuplicatedKeyItems<unknown> {
    return Boolean(o) && typeof o === 'object' && HasKey(o, 'stamp') &&
        o.stamp === DUPLICATE_KEY_ITEMS_STAMP
}

export default class ListToObjectMap<T>
    implements InvertibleTransform<T[], TObjectMap<T>>
{
    private readonly keyOf: TKeyOf<T>

    constructor(keyOf: TKeyOf<T>) {
        this.keyOf = keyOf
    }

    forward(items: T[]) {
        const { keyOf } = this
        const mapped: TObjectMap<T> = {}

        items.forEach((item) => {
            if (IsDuplicatedKeyItems(item)) {
                throw new Error(
                    'ListToObjectMap cannot transform DuplicateKeyItems'
                )
            }

            const key = keyOf(item)
            if (HasKey(mapped, key)) {
                const existing = mapped[key]
                if (IsDuplicatedKeyItems(existing)) {
                    existing.items.push(item)
                } else {
                    mapped[key] = DuplicatedKeyItems(key, [existing, item])
                }
            } else {
                mapped[key] = item
            }
        })

        return mapped
    }

    reverse(map: TObjectMap<T>) {
        const items: T[] = []
        Object.values(map).forEach((item) => {
            if (IsDuplicatedKeyItems(item)) {
                items.push(...item.items)
            } else {
                items.push(item)
            }
        })
        return items
    }
}

type TKey = string
type TKeyOf<T> = (item: T) => TKey
export type TObjectMap<T> = { [k: string]: T | TDuplicatedKeyItems<T> }
