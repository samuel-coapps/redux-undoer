// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

import ListToObjectMap, { DUPLICATE_KEY_ITEMS_STAMP, DuplicatedKeyItems, IsDuplicatedKeyItems } from './listToObjectMap'

describe('ListToObjectMap', () => {
    type TItem = { key: string; value: number }
    const transform = new ListToObjectMap<TItem>((item) => item.key)

    describe('forward', () => {
        test('empty map', () => {
            expect(transform.forward([])).toStrictEqual({})
        })

        test('no duplicate keys', () => {
            expect(
                transform.forward([
                    { key: 'a', value: 0 },
                    { key: 'b', value: 1 },
                    { key: 'c', value: 2 },
                ])
            ).toStrictEqual({
                a: { key: 'a', value: 0 },
                b: { key: 'b', value: 1 },
                c: { key: 'c', value: 2 },
            })
        })

        test('two items have the same key', () => {
            expect(
                transform.forward([
                    { key: 'a', value: 0 },
                    { key: 'a', value: 1 },
                    { key: 'a', value: 2 },
                ])
            ).toStrictEqual({
                a: DuplicatedKeyItems('a', [
                    { key: 'a', value: 0 },
                    { key: 'a', value: 1 },
                    { key: 'a', value: 2 },
                ]),
            })
        })

        test('cannot transform DuplicateKeyItems', () => {
            expect(() => transform.forward([
                // @ts-ignore
                DuplicatedKeyItems('a', [{ key: 'a', value: 0 }])
            ])).toThrow(
                'ListToObjectMap cannot transform DuplicateKeyItems'
            )
        })
    })

    describe('reverse', () => {
        test('empty map', () => {
            expect(transform.reverse({})).toEqual([])
        })

        test('no duplicate keys', () => {
            expect(
                transform.reverse({
                    a: { key: 'a', value: 0 },
                    b: { key: 'b', value: 1 },
                    c: { key: 'c', value: 2 },
                })
            ).toEqual([
                { key: 'a', value: 0 },
                { key: 'b', value: 1 },
                { key: 'c', value: 2 },
            ])
        })

        test('two items have the same key', () => {
            expect(
                transform.reverse({
                    a: DuplicatedKeyItems('a', [
                        { key: 'a', value: 0 },
                        { key: 'a', value: 1 },
                        { key: 'a', value: 2 },
                    ]),
                })
            ).toEqual([
                { key: 'a', value: 0 },
                { key: 'a', value: 1 },
                { key: 'a', value: 2 },
            ])
        })
    })
})

test('DuplicatedKeyItems', () => {
    expect(DuplicatedKeyItems('a', [{ key: 'a' }])).toStrictEqual({
        stamp: DUPLICATE_KEY_ITEMS_STAMP,
        key: 'a',
        items: [{ key: 'a' }]
    })
})

test('IsDuplicatedKeyItems', () => {
    expect(IsDuplicatedKeyItems(null)).toBe(false)
    expect(
        IsDuplicatedKeyItems({ key: 'a', items: [{ key: 'a' }] })
    ).toBe(false)
    expect(
        IsDuplicatedKeyItems(DuplicatedKeyItems('a', [{ key: 'a' }]))
    ).toBe(true)
})
