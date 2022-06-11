import { Empty, EmptyDiffs } from './emptyDiffs'
import { Ignore } from './ignore'

describe('Ignore', () => {
    test('applyDiff', () => {
        expect(Ignore.applyDiff(0, Empty)).toBe(0)
    })

    test('calculateDiff', () => {
        expect(Ignore.calculateDiffs(0, 1)).toBe(EmptyDiffs)
    })

    test('diffsIntersect', () => {
        expect(Ignore.diffsIntersect(Empty, Empty)).toBe(false)
    })
})
