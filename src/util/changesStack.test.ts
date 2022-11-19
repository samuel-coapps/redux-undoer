// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------
import ChangesStack from './changesStack'

describe('ChangesStack', () => {
    test('undo & redo', () => {
        const stack = new ChangesStack<number>(2)

        expect(stack.undo()).toBe(undefined)
        expect(stack.redo()).toBe(undefined)

        stack.putChange(0)

        expect(stack.redo()).toBe(undefined)
        expect(stack.undo()).toBe(0)
        expect(stack.undo()).toBe(undefined)
        expect(stack.redo()).toBe(0)
        expect(stack.redo()).toBe(undefined)

        stack.putChange(1)

        expect(stack.redo()).toBe(undefined)
        expect(stack.undo()).toBe(1)
        expect(stack.undo()).toBe(0)
        expect(stack.undo()).toBe(undefined)
        expect(stack.redo()).toBe(0)
        expect(stack.redo()).toBe(1)
        expect(stack.redo()).toBe(undefined)
    })

    test('drop tailing redoes after putChange', () => {
        const stack = new ChangesStack<number>(2)

        stack.putChange(0)
        stack.putChange(1)

        stack.undo()
        stack.putChange(2)

        expect(stack.redo()).toBe(undefined)
        expect(stack.undo()).toBe(2)
        expect(stack.undo()).toBe(0)
        expect(stack.undo()).toBe(undefined)
        expect(stack.redo()).toBe(0)
        expect(stack.redo()).toBe(2)
        expect(stack.redo()).toBe(undefined)
    })

    test('find', () => {
        const stack = new ChangesStack<number>(2)

        stack.putChange(0)
        stack.putChange(1)

        expect(stack.find((e) => e === 0)).toBe(0)
        expect(stack.find((e) => e === 1)).toBe(1)

        expect(stack.find(() => false)).toBe(undefined)
    })

    test('peek', () => {
        const stack = new ChangesStack<number>(2)

        expect(stack.peek()).toBe(undefined)
        stack.putChange(0)
        expect(stack.peek()).toBe(0)
        stack.putChange(1)
        expect(stack.peek()).toBe(1)

        expect(stack.undo()).toBe(1)
        expect(stack.peek()).toBe(0)
        expect(stack.undo()).toBe(0)
        expect(stack.peek()).toBe(undefined)
        expect(stack.redo()).toBe(0)
        expect(stack.peek()).toBe(0)
        expect(stack.redo()).toBe(1)
        expect(stack.peek()).toBe(1)
    })

    test('dropTail', () => {
        const stack = new ChangesStack<number>(4)

        stack.putChange(0)

        stack.undo()

        stack.dropTail()
        expect(stack.peek()).toBe(undefined)
        expect(stack.undo()).toBe(undefined)

        stack.putChange(0)
        stack.putChange(1)
        stack.putChange(2)
        stack.putChange(3)
        stack.undo()
        stack.undo()

        stack.dropTail()
        expect(stack.undo()).toBe(1)
        expect(stack.undo()).toBe(0)
        expect(stack.redo()).toBe(0)
        expect(stack.redo()).toBe(1)
        expect(stack.redo()).toBe(undefined)
    })

    test('clear', () => {
        const stack = new ChangesStack<number>(2)

        stack.putChange(0)

        stack.clear()
        expect(stack.peek()).toBe(undefined)
        expect(stack.undo()).toBe(undefined)

        stack.putChange(0)
        stack.putChange(1)
        stack.putChange(2)

        stack.clear()
        expect(stack.peek()).toBe(undefined)
        expect(stack.undo()).toBe(undefined)
    })

    describe('capacity 3', () => {
        test('next undo is change 3', () => {
            const stack = new ChangesStack<number>(3)

            stack.putChange(0)
            stack.putChange(1)
            stack.putChange(2)
            stack.putChange(3)

            // 0 Should be dropped due to the capacity constraint
            expect(stack.redo()).toBe(undefined)
            expect(stack.undo()).toBe(3)
            expect(stack.undo()).toBe(2)
            expect(stack.undo()).toBe(1)
            expect(stack.undo()).toBe(undefined)
            expect(stack.redo()).toBe(1)
            expect(stack.redo()).toBe(2)
            expect(stack.redo()).toBe(3)
            expect(stack.redo()).toBe(undefined)
        })

        test('next undo is change 2', () => {
            const stack = new ChangesStack<number>(3)

            stack.putChange(0)
            stack.putChange(1)
            stack.putChange(2)

            expect(stack.undo()).toBe(2)

            stack.putChange(3)

            expect(stack.redo()).toBe(undefined)
            expect(stack.undo()).toBe(3)
            expect(stack.undo()).toBe(1)
            expect(stack.undo()).toBe(0)
            expect(stack.undo()).toBe(undefined)
            expect(stack.redo()).toBe(0)
            expect(stack.redo()).toBe(1)
            expect(stack.redo()).toBe(3)
            expect(stack.redo()).toBe(undefined)
        })

        test('next undo is change 1', () => {
            const stack = new ChangesStack<number>(3)

            stack.putChange(0)
            stack.putChange(1)
            stack.putChange(2)

            expect(stack.undo()).toBe(2)
            expect(stack.undo()).toBe(1)

            stack.putChange(3)

            expect(stack.redo()).toBe(undefined)
            expect(stack.undo()).toBe(3)
            expect(stack.undo()).toBe(0)
            expect(stack.undo()).toBe(undefined)
            expect(stack.redo()).toBe(0)
            expect(stack.redo()).toBe(3)
            expect(stack.redo()).toBe(undefined)
        })

        test('at the end of the undo list', () => {
            const stack = new ChangesStack<number>(3)

            stack.putChange(0)
            stack.putChange(1)
            stack.putChange(2)

            expect(stack.undo()).toBe(2)
            expect(stack.undo()).toBe(1)
            expect(stack.undo()).toBe(0)

            stack.putChange(3)

            expect(stack.redo()).toBe(undefined)
            expect(stack.undo()).toBe(3)
            expect(stack.undo()).toBe(undefined)
            expect(stack.redo()).toBe(3)
            expect(stack.redo()).toBe(undefined)
        })
    })
})
