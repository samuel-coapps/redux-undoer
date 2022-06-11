// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import SelectiveDifferencer, { SelectiveDiff } from './selective'
import IdentityDifferencer, { IdentityDiff } from './identity'
import { Empty, EmptyDiffs } from './emptyDiffs'
import { ForwardReverse } from './util'

describe('SelectiveDifferencer', () => {
    describe('applyDiff', () => {
        test('no parts', () => {
            const D = new SelectiveDifferencer({})
            expect(D.applyDiff({}, SelectiveDiff({}))).toEqual({})
        })

        test('empty diff for three parts', () => {
            const D = new SelectiveDifferencer<T3Parts, typeof spec3Parts>(
                spec3Parts
            )
            const current = {
                part0: 0,
                nest1: { part1: 0 },
                nest2: { nest1: { part2: 0 } },
            }
            expect(D.applyDiff(current, Empty)).toBe(current)
        })

        test('three parts which all differ', () => {
            const D = new SelectiveDifferencer<T3Parts, typeof spec3Parts>(
                spec3Parts
            )
            const current = {
                part0: 0,
                nest1: { part1: 0 },
                nest2: { nest1: { part2: 0 } },
            }
            const diff = SelectiveDiff<T3Parts, typeof spec3Parts>({
                part0: IdentityDiff(0, 1),
                part1: IdentityDiff(0, 1),
                part2: IdentityDiff(0, 1),
            })
            expect(D.applyDiff(current, diff)).toEqual({
                part0: 1,
                nest1: { part1: 1 },
                nest2: { nest1: { part2: 1 } },
            })
        })

        test('three parts, but only one differs', () => {
            const D = new SelectiveDifferencer<T3Parts, typeof spec3Parts>(
                spec3Parts
            )
            const current = {
                part0: 0,
                nest1: { part1: 0 },
                nest2: { nest1: { part2: 0 } },
            }
            const diff = SelectiveDiff<T3Parts, typeof spec3Parts>({
                part1: IdentityDiff(0, 1),
            })
            expect(D.applyDiff(current, diff)).toEqual({
                part0: 0,
                nest1: { part1: 1 },
                nest2: { nest1: { part2: 0 } },
            })
        })
    })

    describe('calculateDiffs', () => {
        test('no parts', () => {
            const D = new SelectiveDifferencer({})
            expect(D.calculateDiffs({}, {})).toBe(EmptyDiffs)
        })

        test('empty diff for three parts', () => {
            const D = new SelectiveDifferencer<T3Parts, typeof spec3Parts>(
                spec3Parts
            )
            expect(
                D.calculateDiffs(
                    {
                        part0: 0,
                        nest1: { part1: 0 },
                        nest2: { nest1: { part2: 0 } },
                    },
                    {
                        part0: 0,
                        nest1: { part1: 0 },
                        nest2: { nest1: { part2: 0 } },
                    }
                )
            ).toBe(EmptyDiffs)
        })

        test('three parts which all differ', () => {
            const D = new SelectiveDifferencer<T3Parts, typeof spec3Parts>(
                spec3Parts
            )
            expect(
                D.calculateDiffs(
                    {
                        part0: 0,
                        nest1: { part1: 0 },
                        nest2: { nest1: { part2: 0 } },
                    },
                    {
                        part0: 1,
                        nest1: { part1: 1 },
                        nest2: { nest1: { part2: 1 } },
                    }
                )
            ).toStrictEqual(
                ForwardReverse(
                    SelectiveDiff<T3Parts, typeof spec3Parts>({
                        part0: IdentityDiff(0, 1),
                        part1: IdentityDiff(0, 1),
                        part2: IdentityDiff(0, 1),
                    }),
                    SelectiveDiff<T3Parts, typeof spec3Parts>({
                        part0: IdentityDiff(1, 0),
                        part1: IdentityDiff(1, 0),
                        part2: IdentityDiff(1, 0),
                    })
                )
            )
        })

        test('three parts, but only one differs', () => {
            const D = new SelectiveDifferencer<T3Parts, typeof spec3Parts>(
                spec3Parts
            )
            expect(
                D.calculateDiffs(
                    {
                        part0: 0,
                        nest1: { part1: 0 },
                        nest2: { nest1: { part2: 0 } },
                    },
                    {
                        part0: 0,
                        nest1: { part1: 1 },
                        nest2: { nest1: { part2: 0 } },
                    }
                )
            ).toStrictEqual(
                ForwardReverse(
                    SelectiveDiff<T3Parts, typeof spec3Parts>({
                        part1: IdentityDiff(0, 1),
                    }),
                    SelectiveDiff<T3Parts, typeof spec3Parts>({
                        part1: IdentityDiff(1, 0),
                    })
                )
            )
        })
    })

    test('diffsIntersect', () => {
        const D = new SelectiveDifferencer<T3Parts, typeof spec3Parts>(
            spec3Parts
        )
        const diff0 = SelectiveDiff<T3Parts, typeof spec3Parts>({
            part0: IdentityDiff(0, 1),
        })
        const diff1 = SelectiveDiff<T3Parts, typeof spec3Parts>({
            part1: IdentityDiff(0, 1),
        })
        const diff2 = SelectiveDiff<T3Parts, typeof spec3Parts>({
            part2: IdentityDiff(0, 1),
        })
        const diff01 = SelectiveDiff<T3Parts, typeof spec3Parts>({
            part0: IdentityDiff(0, 1),
            part1: IdentityDiff(0, 1),
        })
        const diff02 = SelectiveDiff<T3Parts, typeof spec3Parts>({
            part0: IdentityDiff(0, 1),
            part2: IdentityDiff(0, 1),
        })
        const diff12 = SelectiveDiff<T3Parts, typeof spec3Parts>({
            part1: IdentityDiff(0, 1),
            part2: IdentityDiff(0, 1),
        })
        const diff012 = SelectiveDiff<T3Parts, typeof spec3Parts>({
            part0: IdentityDiff(0, 1),
            part1: IdentityDiff(0, 1),
            part2: IdentityDiff(0, 1),
        })

        expect(D.diffsIntersect(Empty, Empty)).toBe(false)
        expect(D.diffsIntersect(Empty, diff01)).toBe(false)
        expect(D.diffsIntersect(diff01, Empty)).toBe(false)
        
        expect(D.diffsIntersect(diff0, diff0)).toBe(true)
        expect(D.diffsIntersect(diff0, diff1)).toBe(false)
        expect(D.diffsIntersect(diff0, diff2)).toBe(false)
        expect(D.diffsIntersect(diff0, diff01)).toBe(true)
        expect(D.diffsIntersect(diff0, diff02)).toBe(true)
        expect(D.diffsIntersect(diff0, diff12)).toBe(false)
        expect(D.diffsIntersect(diff0, diff012)).toBe(true)

        expect(D.diffsIntersect(diff1, diff0)).toBe(false)
        expect(D.diffsIntersect(diff1, diff1)).toBe(true)
        expect(D.diffsIntersect(diff1, diff2)).toBe(false)
        expect(D.diffsIntersect(diff1, diff01)).toBe(true)
        expect(D.diffsIntersect(diff1, diff02)).toBe(false)
        expect(D.diffsIntersect(diff1, diff12)).toBe(true)
        expect(D.diffsIntersect(diff1, diff012)).toBe(true)

        expect(D.diffsIntersect(diff2, diff0)).toBe(false)
        expect(D.diffsIntersect(diff2, diff1)).toBe(false)
        expect(D.diffsIntersect(diff2, diff2)).toBe(true)
        expect(D.diffsIntersect(diff2, diff01)).toBe(false)
        expect(D.diffsIntersect(diff2, diff02)).toBe(true)
        expect(D.diffsIntersect(diff2, diff12)).toBe(true)
        expect(D.diffsIntersect(diff2, diff012)).toBe(true)

        expect(D.diffsIntersect(diff01, diff0)).toBe(true)
        expect(D.diffsIntersect(diff01, diff1)).toBe(true)
        expect(D.diffsIntersect(diff01, diff2)).toBe(false)
        expect(D.diffsIntersect(diff01, diff01)).toBe(true)
        expect(D.diffsIntersect(diff01, diff02)).toBe(true)
        expect(D.diffsIntersect(diff01, diff12)).toBe(true)
        expect(D.diffsIntersect(diff01, diff012)).toBe(true)

        expect(D.diffsIntersect(diff02, diff0)).toBe(true)
        expect(D.diffsIntersect(diff02, diff1)).toBe(false)
        expect(D.diffsIntersect(diff02, diff2)).toBe(true)
        expect(D.diffsIntersect(diff02, diff01)).toBe(true)
        expect(D.diffsIntersect(diff02, diff02)).toBe(true)
        expect(D.diffsIntersect(diff02, diff12)).toBe(true)
        expect(D.diffsIntersect(diff02, diff012)).toBe(true)

        expect(D.diffsIntersect(diff12, diff0)).toBe(false)
        expect(D.diffsIntersect(diff12, diff1)).toBe(true)
        expect(D.diffsIntersect(diff12, diff2)).toBe(true)
        expect(D.diffsIntersect(diff12, diff01)).toBe(true)
        expect(D.diffsIntersect(diff12, diff02)).toBe(true)
        expect(D.diffsIntersect(diff12, diff12)).toBe(true)
        expect(D.diffsIntersect(diff12, diff012)).toBe(true)

        expect(D.diffsIntersect(diff012, diff0)).toBe(true)
        expect(D.diffsIntersect(diff012, diff1)).toBe(true)
        expect(D.diffsIntersect(diff012, diff2)).toBe(true)
        expect(D.diffsIntersect(diff012, diff01)).toBe(true)
        expect(D.diffsIntersect(diff012, diff02)).toBe(true)
        expect(D.diffsIntersect(diff012, diff12)).toBe(true)
        expect(D.diffsIntersect(diff012, diff012)).toBe(true)
    })
})

test('SelectiveDiff', () => {
    const diff = SelectiveDiff<T3Parts, typeof spec3Parts>({
        part0: IdentityDiff(0, 1),
        part1: IdentityDiff(0, 1),
        part2: IdentityDiff(0, 1),
    })
    expect(diff).toStrictEqual({
        partDiffs: {
            part0: IdentityDiff(0, 1),
            part1: IdentityDiff(0, 1),
            part2: IdentityDiff(0, 1),
        },
        isEmpty: false
    })
})

type T3Parts = {
    part0: number
    nest1: { part1: number }
    nest2: { nest1: { part2: number } }
}
const spec3Parts = {
    part0: {
        get(whole: T3Parts) {
            return whole.part0
        },
        set(whole: T3Parts, part: number) {
            whole.part0 = part
        },
        differencer: new IdentityDifferencer(),
    },
    part1: {
        get(whole: T3Parts) {
            return whole.nest1.part1
        },
        set(whole: T3Parts, part: number) {
            whole.nest1.part1 = part
        },
        differencer: new IdentityDifferencer(),
    },
    part2: {
        get(whole: T3Parts) {
            return whole.nest2.nest1.part2
        },
        set(whole: T3Parts, part: number) {
            whole.nest2.nest1.part2 = part
        },
        differencer: new IdentityDifferencer(),
    },
}
