// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import { Diff, Transforms } from './index'
import IdentityDifferencer, { IdentityDiff } from './identity'
import { ForwardReverse } from './util'
import ObjectDifferencer, { MapDiff } from './object'
import { Empty } from './emptyDiffs'

describe('Diff', () => {
    test('objectMap', () => {
        let D = Diff.objectMap({})
        let diffs = D.calculateDiffs({ key0: 0 }, { key1: 1 })
        expect(diffs).toStrictEqual(
            ForwardReverse(
                MapDiff(
                    new Map([['key1', 1]]),
                    new Map(),
                    new Map([['key0', 0]])
                ),
                MapDiff(
                    new Map([['key0', 0]]),
                    new Map(),
                    new Map([['key1', 1]]),
                )
            )
        )
        expect(D.applyDiff({ key0: 0, key1: 0 }, diffs.forward)).toStrictEqual(
            { key1: 1 }
        )

        const transform =
            { forward: jest.fn(x => x), reverse: x => x }
        D = Diff.objectMap({
            differencer: Diff.transform(transform, Diff.identity()),
            overwriteExisting: false
        })
        diffs = D.calculateDiffs({ key0: 0 }, { key0: 1, key1: 1 })
        expect(diffs).toStrictEqual(
            ForwardReverse(
                MapDiff(
                    new Map([['key1', 1]]),
                    new Map([['key0', IdentityDiff(0, 1)]]),
                    new Map()
                ),
                MapDiff(
                    new Map(),
                    new Map([['key0', IdentityDiff(1, 0)]]),
                    new Map([['key1', 1]]),
                )
            )
        )
        expect(transform.forward).toBeCalledTimes(2)
        expect(transform.forward).toHaveBeenNthCalledWith(1, 0)
        expect(transform.forward).toHaveBeenNthCalledWith(2, 1)
        expect(D.applyDiff({ key0: 0, key1: 0 }, diffs.forward)).toStrictEqual(
            { key0: 1, key1: 0 }
        )
    })

    test('identity', () => {
        let D = Diff.identity({ requireSameFrom: false })
        expect(D).toBeInstanceOf(IdentityDifferencer)
        expect(D.applyDiff(2, D.calculateDiffs(0, 1).forward)).toBe(1)

        D = Diff.identity({ requireSameFrom: true })
        expect(D.applyDiff(2, D.calculateDiffs(0, 1).forward)).toBe(2)
    })

    test('record', () => {
        const fields = { known: new IdentityDifferencer() }
        const D = Diff.record(fields)
        expect(D).toBeInstanceOf(ObjectDifferencer)

        expect(D.calculateDiffs(
            { known: 0, unknown: 0 },
            { known: 1, unknown: 1 }
        )).toStrictEqual(
            ForwardReverse(
                MapDiff(
                    new Map(),
                    new Map([['known', IdentityDiff(0, 1)]]),
                    new Map()
                ),
                MapDiff(
                    new Map(),
                    new Map([['known', IdentityDiff(1, 0)]]),
                    new Map()
                )
            )
        )
    })

    test('nullable', () => {
        type TAB = { a: number, b: number }
        const base = new ObjectDifferencer<TAB>()
        const D = Diff.nullable(base)

        const a0b0 = { a: 0, b: 0 }

        const dNN = D.calculateDiffs(null, undefined)
        const dNO = D.calculateDiffs(null, a0b0)
        const dON = D.calculateDiffs(a0b0, null)
        const dOOa = D.calculateDiffs(a0b0, { a: 1, b: 0 })
        const dOOb = D.calculateDiffs(a0b0, { a: 0, b: 1 })

        expect(D.applyDiff(null, dNN.forward)).toBe(undefined)
        expect(D.applyDiff(undefined, dNN.reverse)).toBe(null)

        expect(D.applyDiff(null, dNO.forward)).toStrictEqual(a0b0)
        expect(D.applyDiff(a0b0, dNO.reverse)).toBe(null)

        expect(D.applyDiff(a0b0, dON.forward)).toBe(null)
        expect(D.applyDiff(null, dON.reverse)).toStrictEqual(a0b0)

        expect(D.applyDiff(a0b0, dOOa.forward)).toStrictEqual({ a: 1, b: 0 })
        expect(D.applyDiff({ a: 1, b: 0 }, dOOa.reverse)).toStrictEqual(a0b0)

        expect(D.applyDiff(a0b0, dOOb.forward)).toStrictEqual({ a: 0, b: 1 })
        expect(D.applyDiff({ a: 0, b: 1 }, dOOb.reverse)).toStrictEqual(a0b0)

        expect(D.diffsIntersect(Empty, Empty)).toBe(false)
        expect(D.diffsIntersect(Empty, dNN.forward)).toBe(false)
        expect(D.diffsIntersect(Empty, dNO.forward)).toBe(false)
        expect(D.diffsIntersect(Empty, dON.forward)).toBe(false)
        expect(D.diffsIntersect(Empty, dOOa.forward)).toBe(false)
        expect(D.diffsIntersect(Empty, dOOb.forward)).toBe(false)

        expect(D.diffsIntersect(dNN.forward, dNN.forward)).toBe(true)
        expect(D.diffsIntersect(dNN.forward, dNO.forward)).toBe(true)
        expect(D.diffsIntersect(dNN.forward, dON.forward)).toBe(true)
        expect(D.diffsIntersect(dNN.forward, dOOa.forward)).toBe(true)
        expect(D.diffsIntersect(dNN.forward, dOOb.forward)).toBe(true)

        expect(D.diffsIntersect(dNO.forward, dNN.forward)).toBe(true)
        expect(D.diffsIntersect(dNO.forward, dNO.forward)).toBe(true)
        expect(D.diffsIntersect(dNO.forward, dON.forward)).toBe(true)
        expect(D.diffsIntersect(dNO.forward, dOOa.forward)).toBe(true)
        expect(D.diffsIntersect(dNO.forward, dOOb.forward)).toBe(true)

        expect(D.diffsIntersect(dON.forward, dNN.forward)).toBe(true)
        expect(D.diffsIntersect(dON.forward, dNO.forward)).toBe(true)
        expect(D.diffsIntersect(dON.forward, dON.forward)).toBe(true)
        expect(D.diffsIntersect(dON.forward, dOOa.forward)).toBe(true)
        expect(D.diffsIntersect(dON.forward, dOOb.forward)).toBe(true)

        expect(D.diffsIntersect(dOOa.forward, dNN.forward)).toBe(true)
        expect(D.diffsIntersect(dOOa.forward, dNO.forward)).toBe(true)
        expect(D.diffsIntersect(dOOa.forward, dON.forward)).toBe(true)
        expect(D.diffsIntersect(dOOa.forward, dOOa.forward)).toBe(true)
        expect(D.diffsIntersect(dOOa.forward, dOOb.forward)).toBe(false)

        expect(D.diffsIntersect(dOOb.forward, dNN.forward)).toBe(true)
        expect(D.diffsIntersect(dOOb.forward, dNO.forward)).toBe(true)
        expect(D.diffsIntersect(dOOb.forward, dON.forward)).toBe(true)
        expect(D.diffsIntersect(dOOb.forward, dOOa.forward)).toBe(false)
        expect(D.diffsIntersect(dOOb.forward, dOOb.forward)).toBe(true)

        expect(D.diffsIntersect(dOOa.forward, dOOa.reverse)).toBe(true)
        expect(D.diffsIntersect(dOOb.forward, dOOb.reverse)).toBe(true)
    })
})

describe('Transforms', () => {
    describe('jsonText', () => {
        test('default differencer', () => {
            const D = Transforms.json()
            expect(D.calculateDiffs({ a: 0 }, { a: 1 })).toStrictEqual(
                ForwardReverse(
                    IdentityDiff('{"a":0}', '{"a":1}'),
                    IdentityDiff('{"a":1}', '{"a":0}')
                )
            )
            expect(D.calculateDiffs(undefined, { a: 1 })).toStrictEqual(
                ForwardReverse(
                    IdentityDiff(undefined, '{"a":1}'),
                    IdentityDiff('{"a":1}', undefined)
                )
            )
            expect(
                D.applyDiff({ a: 0 }, IdentityDiff('{"a":0}', '{"a":1}'))
            ).toStrictEqual({ a: 1 })
            expect(
                D.applyDiff(undefined, IdentityDiff(undefined, '{"a":1}'))
            ).toStrictEqual({ a: 1 })
            expect(
                D.applyDiff({ a: 0 }, IdentityDiff('{"a":0}', undefined))
            ).toBe(undefined)
        })

        test('custom differencer', () => {
            const D = Transforms.json(
                Diff.transform(
                    {
                        forward: text => text ? `j${text}` : text,
                        reverse: text => text ? text.substring(1) : text
                    },
                    Diff.identity()
                )
            )
            expect(D.calculateDiffs({ a: 0 }, { a: 1 })).toStrictEqual(
                ForwardReverse(
                    IdentityDiff('j{"a":0}', 'j{"a":1}'),
                    IdentityDiff('j{"a":1}', 'j{"a":0}')
                )
            )
            expect(D.calculateDiffs(undefined, { a: 1 })).toStrictEqual(
                ForwardReverse(
                    IdentityDiff(undefined, 'j{"a":1}'),
                    IdentityDiff('j{"a":1}', undefined)
                )
            )
            expect(
                D.applyDiff({ a: 0 }, IdentityDiff('j{"a":0}', 'j{"a":1}'))
            ).toStrictEqual({ a: 1 })
            expect(
                D.applyDiff(undefined, IdentityDiff(undefined, 'j{"a":1}'))
            ).toStrictEqual({ a: 1 })
            expect(
                D.applyDiff({ a: 0 }, IdentityDiff('j{"a":0}', undefined))
            ).toBe(undefined)
        })
    })

    test('listToObjectMap', () => {
        const d = Transforms.listToObjectMap<{ key: string, value: number }>(
            {
                keyOf: x => x.key,
                differencers: {
                    unique: Transforms.json(),
                    duplicated: Transforms.json()
                }
            }
        )

        const kAv0 = { key: 'A', value: 0 }
        const kAv1 = { key: 'A', value: 1 }
        const kBv0 = { key: 'B', value: 0 }
        const kBv1 = { key: 'B', value: 1 }

        const diff0 = d.calculateDiffs([kAv0], [kAv1])
        const diff1 = d.calculateDiffs([kAv0], [kAv0, kAv1])
        const diff2 = d.calculateDiffs([kBv0], [kBv1])

        expect(d.applyDiff([kAv0], diff0.forward)).toStrictEqual([kAv1])
        expect(d.applyDiff([kAv0], diff1.forward)).toStrictEqual([kAv0, kAv1])

        expect(d.diffsIntersect(diff0.forward, diff1.forward)).toBe(true)
        expect(d.diffsIntersect(diff0.forward, diff2.forward)).toBe(false)
        expect(d.diffsIntersect(diff1.forward, diff2.forward)).toBe(false)
    })
})
