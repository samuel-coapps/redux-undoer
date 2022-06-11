// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import TransformDifferencer, { InvertibleTransform } from './transform'
import IdentityDifferencer, { TOptions as TIdentityOptions } from './identity'
import ObjectDifferencer, {
    TOptions as TObjectOptions,
    TFieldDifferencers, TOptions
} from './object'
import RoutingDifferencer, { TRouter, TRouteSpec, TRoutingDiff } from './routing'
import ListToObjectMap, {
    DuplicatedKeyItems, IsDuplicatedKeyItems, TDuplicatedKeyItems,
    TObjectMap
} from './listToObjectMap'
import { IDifferencer, IDiff } from './types'
import SelectiveDifferencer, { TSelectiveSpec } from './selective'
import { Ignore } from './ignore'
import { SetDifferencer } from './set'
import { MapDifferencer } from './map'

const Diff = {
    object <
        T extends object,
        TValueDiff extends IDiff = IDiff
    > (options?: TObjectOptions<T, TValueDiff>) {
        return new ObjectDifferencer(options)
    },
    objectMap<
        V,
        K extends string | number | symbol = string,
        TValueDiff extends IDiff = IDiff
    >(options: {
        differencer?: IDifferencer<V, TValueDiff>,
        overwriteExisting?: boolean
    }) {
        const adaptedOptions: TObjectOptions<{ [k in K]: V }, TValueDiff> = {}
        if (typeof options.overwriteExisting === 'boolean') {
            adaptedOptions.overwriteExisting = options.overwriteExisting
        }
        if (options.differencer) {
            adaptedOptions.differencers = { primary: options.differencer }
        }

        return new ObjectDifferencer<{ [k in K]: V }, TValueDiff>(
            adaptedOptions
        )
    },
    identity(options?: TIdentityOptions) {
        return new IdentityDifferencer(options)
    },
    record<
        T extends object,
        TDifferencers extends TFieldDifferencers<T, IDiff>
    >(
        differencers: TDifferencers
    ) {
        return new ObjectDifferencer<T>({
            differencers: {
                primary: Ignore,
                overrides: differencers
            }
        })
    },
    case<TSpec extends TRouteSpec<TSpec>>(
        cases: TSpec,
        router: TRouter<TSpec>,
        crossIntersector: (
            diffA: TRoutingDiff<TSpec, keyof TSpec>,
            diffB: TRoutingDiff<TSpec, keyof TSpec>
        ) => boolean
    ) {
        return new RoutingDifferencer<TSpec>(cases, router, crossIntersector)
    },
    selective<TWhole, TSpec extends TSelectiveSpec<TWhole, TSpec>>(
        spec: TSpec
    ) {
        return new SelectiveDifferencer<TWhole, TSpec>(spec)
    },
    transform<TValue, TResult, TDiff extends IDiff>(
        transform: InvertibleTransform<TValue, TResult>,
        differencer: IDifferencer<TResult, TDiff>
    ) {
        return new TransformDifferencer<TValue, TResult, TDiff>(
            transform,
            differencer
        )
    },
    set () {
        return new SetDifferencer()
    },
    map<K, V, VDiff extends IDiff = IDiff> (
        differencer?: IDifferencer<V, IDiff>
    ) {
        return new MapDifferencer<K, V, VDiff>(differencer)
    },
    nullable<V, TDIff extends IDiff> (differencer: IDifferencer<V, TDIff>) {
        return new RoutingDifferencer(
            {
                nullable: new IdentityDifferencer() as
                    IDifferencer<null | undefined, IDiff>,
                base: differencer
            },
            (valueA, valueB) => {
                if (valueA === null || valueA === undefined ||
                    valueB === null || valueB === undefined
                ) {
                    return 'nullable'
                }
                return 'base'
            },
            () => true
        )
    },
}

const Transforms = {
    json(
        differencer: IDifferencer<string | undefined, IDiff> = Diff.identity()
    ) {
        const transform: InvertibleTransform<any, string | undefined> = {
            forward(value: any) {
                return JSON.stringify(value)
            },
            reverse(value: string | undefined) {
                return value === undefined ? undefined : JSON.parse(value)
            },
        }
        return new TransformDifferencer<any, string | undefined, IDiff>(
            transform,
            differencer
        )
    },
    listToObjectMap<T>(options: {
        keyOf: (item: T) => string
        differencers: {
            unique: IDifferencer<T, IDiff>
            duplicated: IDifferencer<T | TDuplicatedKeyItems<T>, IDiff>
        }
    }) {
        const handleDuplicates = Diff.case(
            options.differencers,
            (x, y) =>
                IsDuplicatedKeyItems(x) || IsDuplicatedKeyItems(y) ?
                    'duplicated' : 'unique',
            () => true
        )

        return Diff.transform<T[], TObjectMap<T>, IDiff>(
            new ListToObjectMap(options.keyOf),
            Diff.objectMap<T | TDuplicatedKeyItems<T>>({
                differencer: handleDuplicates,
            })
        )
    },
}

export { Diff, Transforms }

export * from './types'
