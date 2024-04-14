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
import { IForwardReverse } from './types'
import { KeyDifferencer } from "./keys";

const hasOwnProperty = {}.hasOwnProperty

export function HasKey<T extends object>(o: T, k: string | number | symbol) {
    if (o.hasOwnProperty === hasOwnProperty) {
        return o.hasOwnProperty(k)
    }
    return hasOwnProperty.call(o, k)
}

export function ForwardReverse<TDiff> (
    forward: TDiff,
    reverse: TDiff
): IForwardReverse<TDiff> {
    return { forward, reverse }
}

// Used in tests
export function KeyDiff<K> (a: K[], b: K[]) {
    return new KeyDifferencer<K>().calculateDiffs(a, b).forward
}
export function KeyDiffReverse<K> (a: K[], b: K[]) {
    return new KeyDifferencer<K>().calculateDiffs(a, b).reverse
}
