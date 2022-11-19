import { IForwardReverse } from './types'

const hasOwnProperty = {}.hasOwnProperty

export function HasKey<T extends object>(o: T, k: string | number | symbol) {
    if (o.hasOwnProperty === hasOwnProperty) {
        return o.hasOwnProperty(k)
    }
    return hasOwnProperty.call(o, k)
}

export function ForwardReverse<TDiff> (
    forward: TDiff,
    reverse: TDiff
): IForwardReverse<TDiff> {
    return { forward, reverse }
}
