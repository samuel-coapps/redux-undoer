// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import RoutingDifferencer, { RoutingDiff } from './routing'
import IdentityDifferencer, { IdentityDiff } from './identity'
import TransformDifferencer from './transform'
import { EmptyDiffs, Empty } from './emptyDiffs'
import { TDifferencerDiff } from './types'
import SelectiveDifferencer, { SelectiveDiff } from './selective'
import { ForwardReverse } from './util'

describe('RoutingDifferencer', () => {
    const spec = {
        route0: new IdentityDifferencer(),
        route1: new TransformDifferencer(
            AddTransform(1),
            new IdentityDifferencer()
        ),
        route2: new TransformDifferencer(
            AddTransform(2),
            new IdentityDifferencer()
        ),
    }
    const router = jest.fn()
    const intersector = jest.fn()
    const D = new RoutingDifferencer(spec, router, intersector)

    describe('applyDiff', () => {
        test('empty diff', () => {
            expect(D.applyDiff(0, Empty)).toBe(0)
            expect(router).not.toHaveBeenCalled()
            expect(intersector).not.toHaveBeenCalled()
        })

        test('diffs for each of three routes', () => {
            expect(
                D.applyDiff(0, RDiff('route0', IdentityDiff(0, 1)))
            ).toBe(1)

            expect(
                D.applyDiff(0, RDiff('route1', IdentityDiff(1, 2)))
            ).toBe(1)

            expect(
                D.applyDiff(0, RDiff('route2', IdentityDiff(2, 3)))
            ).toBe(1)

            expect(router).not.toHaveBeenCalled()
            expect(intersector).not.toHaveBeenCalled()
        })
    })

    describe('calculateDiffs', () => {
        test('empty diff', () => {
            router.mockReturnValueOnce('route0')
            expect(D.calculateDiffs(0, 0)).toBe(EmptyDiffs)
            expect(router).toHaveBeenCalledTimes(1)
            expect(router).toHaveBeenCalledWith(0, 0)

            expect(intersector).not.toHaveBeenCalled()
        })

        test('diffs for each of three routes', () => {
            router.mockReturnValueOnce('route0')
            expect(D.calculateDiffs(0, 1)).toStrictEqual(
                ForwardReverse(
                    RDiff('route0', IdentityDiff(0, 1)),
                    RDiff('route0', IdentityDiff(1, 0))
                )
            )
            expect(router).toHaveBeenCalledTimes(1)
            expect(router).toHaveBeenCalledWith(0, 1)
            router.mockClear()

            router.mockReturnValueOnce('route1')
            expect(D.calculateDiffs(0, 1)).toStrictEqual(
                ForwardReverse(
                    RDiff('route1', IdentityDiff(1, 2)),
                    RDiff('route1', IdentityDiff(2, 1))
                )
            )
            expect(router).toHaveBeenCalledTimes(1)
            expect(router).toHaveBeenCalledWith(0, 1)
            router.mockClear()

            router.mockReturnValueOnce('route2')
            expect(D.calculateDiffs(0, 1)).toStrictEqual(
                ForwardReverse(
                    RDiff('route2', IdentityDiff(2, 3)),
                    RDiff('route2', IdentityDiff(3, 2))
                )
            )
            expect(router).toHaveBeenCalledTimes(1)
            expect(router).toHaveBeenCalledWith(0, 1)
            router.mockClear()

            expect(intersector).not.toHaveBeenCalled()
        })
    })

    describe('diffsIntersect', () => {
        const trivialPart = {
            get: x => x,
            set: (x, y) => y,
            differencer: new IdentityDifferencer()
        }
        type T2Keys = { key1: number, key2: number }
        const selectiveSpec = {
            key1: trivialPart,
            key2: trivialPart
        }
        const spec = {
            route0: new IdentityDifferencer(),
            route1: new SelectiveDifferencer(selectiveSpec),
        }
        const router = jest.fn()
        const intersector = jest.fn()
        const D = new RoutingDifferencer(spec, router, intersector)

        test('empty diffs', () => {
            const diff = RoutingDiff<typeof spec, 'route0'>(
                'route0',
                IdentityDiff(0, 1)
            )
            expect(D.diffsIntersect(Empty, Empty)).toBe(false)
            expect(D.diffsIntersect(Empty, diff)).toBe(false)
            expect(D.diffsIntersect(diff, Empty)).toBe(false)

            expect(router).not.toHaveBeenCalled()
            expect(intersector).not.toHaveBeenCalled()
        })

        test('same route with intersection', () => {
            const diff1 = RoutingDiff<typeof spec, 'route0'>(
                'route0',
                IdentityDiff(0, 1)
            )
            const diff2 = RoutingDiff<typeof spec, 'route0'>(
                'route0',
                IdentityDiff(1, 2)
            )
            expect(D.diffsIntersect(diff1, diff2)).toBe(true)

            expect(router).not.toHaveBeenCalled()
            expect(intersector).not.toHaveBeenCalled()
        })

        test('same route and no intersection', () => {
            const diff1 = RoutingDiff<typeof spec, 'route1'>(
                'route1',
                SelectiveDiff<T2Keys, typeof selectiveSpec>({
                    key1: IdentityDiff(0, 1)
                })
            )
            const diff2 = RoutingDiff<typeof spec, 'route1'>(
                'route1',
                SelectiveDiff<T2Keys, typeof selectiveSpec>({
                    key2: IdentityDiff(1, 2)
                })
            )

            expect(D.diffsIntersect(diff1, diff2)).toBe(false)
            expect(router).not.toHaveBeenCalled()
            expect(intersector).not.toHaveBeenCalled()
        })

        describe('routes differ', () => {
            const diff1 = RoutingDiff<typeof spec, 'route1'>(
                'route1',
                SelectiveDiff<T2Keys, typeof selectiveSpec>({
                    key1: IdentityDiff(0, 1)
                })
            )
            const diff2 = RoutingDiff<typeof spec, 'route0'>(
                'route0',
                IdentityDiff(1, 2)
            )

            test('intersection', () => {
                intersector.mockReturnValueOnce(true)
                expect(D.diffsIntersect(diff1, diff2)).toBe(true)

                expect(intersector).toHaveBeenCalledTimes(1)
                expect(intersector).toHaveBeenCalledWith(diff1, diff2)

                expect(router).not.toHaveBeenCalled()
            })

            test('no intersection', () => {
                intersector.mockReturnValueOnce(false)
                expect(D.diffsIntersect(diff1, diff2)).toBe(false)

                expect(intersector).toHaveBeenCalledTimes(1)
                expect(intersector).toHaveBeenCalledWith(diff1, diff2)

                expect(router).not.toHaveBeenCalled()
            })
        })

        afterEach(() => {
            router.mockReset()
            intersector.mockReset()
        })
    })

    afterEach(() => {
        router.mockReset()
        intersector.mockReset()
    })

    function AddTransform(delta: number) {
        return {
            forward: (x: number) => x + delta,
            reverse: (x: number) => x - delta,
        }
    }

    function RDiff<K extends keyof typeof spec>(
        key: K,
        diff: TDifferencerDiff<typeof spec[K]>
    ) {
        return RoutingDiff<typeof spec, K>(key, diff)
    }
})

test('RoutingDiff', () => {
    type TSpec = { route1: IdentityDifferencer; route2: IdentityDifferencer }
    expect(
        RoutingDiff<TSpec, keyof TSpec>(
            'route1',
            IdentityDiff(0, 1)
        )
    ).toStrictEqual({
        route: 'route1',
        diff: IdentityDiff(0, 1),
        isEmpty: false
    })
})
