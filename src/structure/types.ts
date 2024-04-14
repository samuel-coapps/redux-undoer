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

export interface IDifferencer<TValue, TDiff extends IDiff> {
    calculateDiffs(from: TValue, to: TValue): IForwardReverse<TDiff>
    applyDiff(value: TValue, diff: TDiff): TValue
    diffsIntersect(diffA: TDiff, diffB: TDiff): boolean
}

export interface IForwardReverse<TDiff> {
    readonly forward: TDiff
    readonly reverse: TDiff
}

export interface IDiff {
    readonly isEmpty: boolean
}

export type TDifferencerValue<T> = T extends IDifferencer<infer V, any>
    ? V
    : never

export type TDifferencerDiff<T> = T extends IDifferencer<any, infer TDiff>
    ? TDiff
    : never
