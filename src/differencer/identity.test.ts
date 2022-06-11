// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------
import IdentityDifferencer, { IdentityDiff } from './identity'
import { EmptyDiffs, Empty } from './emptyDiffs'
import { ForwardReverse } from './util'

describe('IdentityDifferencer', () => {
    describe('applyDiff', () => {
        test('diff is empty', () => {
            expect(new IdentityDifferencer().applyDiff(0, Empty)).toBe(0)
        })

        test('diff is non-empty', () => {
            const diff = IdentityDiff(0, 1)
            expect(new IdentityDifferencer().applyDiff(0, diff)).toBe(1)
            // Do not require same from by default
            expect(new IdentityDifferencer().applyDiff(2, diff)).toBe(1)
        })

        test('requireSameFrom is true', () => {
            const diff = IdentityDiff(0, 1)
            const D = new IdentityDifferencer({ requireSameFrom: true })
            expect(D.applyDiff(0, diff)).toBe(1)
            expect(D.applyDiff(2, diff)).toBe(2)
        })

        test('requireSameFrom is false', () => {
            const diff = IdentityDiff(0, 1)
            const D = new IdentityDifferencer({ requireSameFrom: false })
            expect(D.applyDiff(0, diff)).toBe(1)
            expect(D.applyDiff(2, diff)).toBe(1)
        })
    })

    describe('calculateDiff', () => {
        test('diff is empty', () => {
            expect(new IdentityDifferencer().calculateDiffs(0, 0)).toBe(
                EmptyDiffs
            )
        })

        test('diff is non-empty', () => {
            expect(new IdentityDifferencer().calculateDiffs(0, 1)).toStrictEqual(
                ForwardReverse(
                    IdentityDiff(0, 1),
                    IdentityDiff(1, 0)
                ),
            )
        })
    })

    test('diffsIntersect', () => {
        const differencer = new IdentityDifferencer()
        const diff1 = IdentityDiff(0, 1)
        const diff2 = IdentityDiff(1, 2)
        expect(differencer.diffsIntersect(Empty, Empty)).toBe(false)
        expect(differencer.diffsIntersect(Empty, diff1)).toBe(false)
        expect(differencer.diffsIntersect(diff1, Empty)).toBe(false)
        expect(differencer.diffsIntersect(diff1, diff2)).toBe(true)
    })
})

test('IdentityDiff', () => {
    expect(IdentityDiff(0, 1)).toStrictEqual(
        { from: 0, to: 1, isEmpty: false }
    )
})
