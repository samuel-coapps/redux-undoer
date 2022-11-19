// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import {
    IDifferencer, IForwardReverse,
    TDifferencerDiff,
    TDifferencerValue
} from './types'
import { EmptyDiffs, Empty } from './emptyDiffs'
import { ForwardReverse } from './util'

export type TRoutingDiff<
    TSpec extends TRouteSpec<TSpec>,
    TRoute extends keyof TSpec
> = {
    readonly route: TRoute
    readonly diff: TDifferencerDiff<TSpec[TRoute]>
    readonly isEmpty: false
}

function RoutingDiff<
    TSpec extends TRouteSpec<TSpec>,
    TRoute extends keyof TSpec
> (
    route: TRoute,
    diff: TDifferencerDiff<TSpec[TRoute]>
): TRoutingDiff<TSpec, TRoute> {
    return { route, diff, isEmpty: false }
}

export default class RoutingDifferencer<TSpec extends TRouteSpec<TSpec>>
    implements IDifferencer<TValue<TSpec>, TDiff<TSpec>>
{
    private readonly spec: TSpec
    private readonly router: TRouter<TSpec>
    private readonly crossIntersector: (
        diffA: TRoutingDiff<TSpec, keyof TSpec>,
        diffB: TRoutingDiff<TSpec, keyof TSpec>
    ) => boolean

    constructor(
        spec: TSpec,
        router: TRouter<TSpec>,
        crossIntersector: (
            diffA: TRoutingDiff<TSpec, keyof TSpec>,
            diffB: TRoutingDiff<TSpec, keyof TSpec>
        ) => boolean
    ) {
        this.spec = spec
        this.router = router
        this.crossIntersector = crossIntersector
    }

    applyDiff(value: TValue<TSpec>, diff: TDiff<TSpec>): TValue<TSpec> {
        if (diff.isEmpty === true) {
            return value
        }
        const differencer = this.spec[diff.route]
        return differencer.applyDiff(value, diff.diff) as TValue<TSpec>
    }

    calculateDiffs(
        from: TValue<TSpec>,
        to: TValue<TSpec>
    ): IForwardReverse<TDiff<TSpec>> {
        const route = this.router(from, to)
        const differencer = this.spec[route]
        const diff = differencer.calculateDiffs(from, to)
        if (diff.forward.isEmpty) {
            return EmptyDiffs
        }
        return ForwardReverse(
            // @ts-expect-error
            RoutingDiff(route, diff.forward),
            // @ts-expect-error
            RoutingDiff(route, diff.reverse)
        )
    }

    diffsIntersect(diffA: TDiff<TSpec>, diffB: TDiff<TSpec>) {
        if (
            diffA.isEmpty === true ||
            diffB.isEmpty === true
        ) {
            return false
        }

        if (diffA.route !== diffB.route) {
            return this.crossIntersector(diffA, diffB)
        }

        const differencer = this.spec[diffA.route]
        return differencer.diffsIntersect(diffA.diff, diffB.diff)
    }
}

export { RoutingDiff }

export type TRouter<TSpec extends TRouteSpec<TSpec>> = (
    from: TValue<TSpec>,
    to: TValue<TSpec>
) => keyof TSpec

export type TRouteSpec<T> = {
    [k in keyof T]: TRouteDifferencer<T, k>
}

type TRouteDifferencer<T, K extends keyof T> = T[K] extends IDifferencer<
    infer V,
    infer TDiff
>
    ? IDifferencer<V, TDiff>
    : never

type TValue<TSpec> = TDifferencerValue<TSpec[keyof TSpec]>
type TDiff<TSpec extends TRouteSpec<TSpec>> =
    | TRoutingDiff<TSpec, keyof TSpec>
    | typeof Empty
