// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

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
