// Copyright (c) 2017-present, Global Strategies
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

export default class ChangesStack<TChange> {
    private readonly changeStack: TChange[] = []
    private readonly maxCapacity: number
    private maxAppliedChangeIndex = -1

    constructor(maxCapacity: number) {
        this.maxCapacity = maxCapacity
    }

    putChange(change: TChange) {
        const deleteCount =
            this.changeStack.length - 1 - this.maxAppliedChangeIndex
        this.changeStack.splice(
            this.maxAppliedChangeIndex + 1,
            deleteCount,
            change
        )

        if (this.changeStack.length > this.maxCapacity) {
            this.changeStack.shift()
        }

        this.maxAppliedChangeIndex = this.changeStack.length - 1
    }

    undo() {
        if (this.maxAppliedChangeIndex < 0) {
            return undefined
        }

        this.maxAppliedChangeIndex--
        return this.changeStack[this.maxAppliedChangeIndex + 1]
    }

    redo() {
        if (this.maxAppliedChangeIndex + 1 >= this.changeStack.length) {
            return undefined
        }

        this.maxAppliedChangeIndex++
        return this.changeStack[this.maxAppliedChangeIndex]
    }

    peek() {
        return this.changeStack[this.maxAppliedChangeIndex]
    }

    dropTail() {
        const start = this.maxAppliedChangeIndex
        this.changeStack.splice(start + 1, this.changeStack.length)
    }

    clear() {
        this.changeStack.splice(0, this.changeStack.length)
    }

    find(predicate: (change: TChange) => boolean) {
        return this.changeStack.find(predicate)
    }
}
