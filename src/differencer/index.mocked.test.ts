import SelectiveDifferencer from './selective'
import RoutingDifferencer from './routing'
import { MapDifferencer } from './map'
import { SetDifferencer } from './set'
import { Diff } from './index'
import IdentityDifferencer from './identity'
import TransformDifferencer from './transform'
import ObjectDifferencer from './object'

test('object', () => {
    const options = {
        differencers: {
            primary: new IdentityDifferencer()
        },
        overwriteExisting: true
    }
    const D = Diff.object<any>(options)
    expect(D).toBeInstanceOf(ObjectDifferencer)

    // @ts-expect-error Mocked class has different properties.
    expect(D.args[0]).toBe(options)
})

test('set', () => {
    expect(Diff.set()).toBeInstanceOf(SetDifferencer)
})

test('map', () => {
    expect(Diff.map()).toBeInstanceOf(MapDifferencer)
    // @ts-expect-error Mocked class has different properties.
    expect(Diff.map().args).toEqual([undefined])

    const inner = new IdentityDifferencer()
    const D = Diff.map(inner)
    // @ts-expect-error Mocked class has different properties.
    expect(D.args[0]).toBe(inner)
})

test('routing', () => {
    const cases = { key: new IdentityDifferencer() }
    const router = () => 'key' as const
    const crossIntersector = () => true
    const D = Diff.case(cases, router, crossIntersector)
    expect(D).toBeInstanceOf(RoutingDifferencer)

    // @ts-expect-error Mocked class has different properties.
    expect(D.args[0]).toBe(cases)
    // @ts-expect-error Mocked class has different properties.
    expect(D.args[1]).toBe(router)
    // @ts-expect-error Mocked class has different properties.
    expect(D.args[2]).toBe(crossIntersector)
})

test('transform', () => {
    const transform = {
        forward: x => x,
        reverse: x => x
    }
    const inner = new IdentityDifferencer()
    const D = Diff.transform(transform, inner)
    expect(D).toBeInstanceOf(TransformDifferencer)

    // @ts-expect-error Mocked class has different properties.
    expect(D.args[0]).toBe(transform)
    // @ts-expect-error Mocked class has different properties.
    expect(D.args[1]).toBe(inner)
})

test('selective', () => {
    const spec = {
        selected: {
            get: x => x,
            set () {},
            differencer: new IdentityDifferencer()
        }
    }
    const D = Diff.selective(spec)
    expect(D).toBeInstanceOf(SelectiveDifferencer)

    // @ts-expect-error Mocked class has different properties.
    expect(D.args[0]).toBe(spec)
})

jest.mock('./map', () => ({
    MapDifferencer: MockCaptureConstructorArgs()
}))
jest.mock('./object', () => MockCaptureConstructorArgs())
jest.mock('./routing', () => MockCaptureConstructorArgs())
jest.mock('./selective', () => MockCaptureConstructorArgs())
jest.mock('./transform', () => MockCaptureConstructorArgs())

function MockCaptureConstructorArgs () {
    return class CaptureConstructorArgs {
        readonly args: any[]
        constructor(...args: any[]) {
            this.args = args
        }
    }
}
