import { Random, MersenneTwister19937 } from "random-js";
import { KeyDifferencer } from "./keys";

test('calculateDiffs', () => {
    const differencer = new KeyDifferencer<number>()
    const a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] // [0 1 2 3 4 6 7 8]
    const b = [0, 3, 4, 1000, 2, 1001, 6, 7, 8, 1, 1002] // [0 3 4 2 6 7 8 1]
    const diffs = differencer.calculateDiffs(a, b)
    expect(diffs.forward).toEqual({
        isEmpty: false,
        lengthBefore: 10,
        lengthAfter: 11,
        deletes: [5, 5, 9, 9],
        blockPositions: [3, 1, 2, 5, 4, 3],
        itemPositions: [1, 7, 2, 3],
        inserts: [3, 1000, 5, 1001, 10, 1002],
        isReverse: false,
    })
    expect(diffs.reverse).toEqual({
        isEmpty: false,
        lengthBefore: 11,
        lengthAfter: 10,
        deletes: [3, 1000, 5, 1001, 10, 1002],
        blockPositions: [3, 1, 2, 5, 4, 3],
        itemPositions: [1, 7, 2, 3],
        inserts: [5, 5, 9, 9],
        isReverse: true,
    })
})

test('applyDiffs', () => {
    const differencer = new KeyDifferencer<number>()
    const a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const b = [0, 3, 4, 1000, 2, 1001, 6, 7, 8, 1, 1002]
    expect(differencer.applyDiff(a, {
        isEmpty: false,
        lengthBefore: 10,
        lengthAfter: 11,
        deletes: [5, 5, 9, 9],
        blockPositions: [3, 1, 2, 5, 4, 3],
        itemPositions: [1, 7, 2, 3],
        inserts: [3, 1000, 5, 1001, 10, 1002],
        isReverse: false,
    })).toEqual(b)
    expect(differencer.applyDiff(b, {
        isEmpty: false,
        lengthBefore: 11,
        lengthAfter: 10,
        deletes: [3, 1000, 5, 1001, 10, 1002],
        blockPositions: [3, 1, 2, 5, 4, 3],
        itemPositions: [1, 7, 2, 3],
        inserts: [5, 5, 9, 9],
        isReverse: true,
    })).toEqual(a)
})

describe('no loss of information', () => {
    describe('small changes', () => {
        test('two inserts', () => {
            for (let i0 = 0; i0 <= 8; i0++) {
                for (let i1 = 0; i1 <= 9; i1++) {
                    const base = [0, 1, 2, 3, 4, 5, 6, 7]
                    const next = [...base]
                    insert(next, i0, 1000)
                    insert(next, i1, 1001)
                    DoTest(base, next)
                }
            }
        })

        test('two deletes', () => {
            for (let d0 = 1; d0 < 8; d0++) {
                for (let d1 = 0; d1 < d0; d1++) {
                    const base = [0, 1, 2, 3, 4, 5, 6, 7]
                    const next = [...base]
                    deleteItem(next, d0)
                    deleteItem(next, d1)
                    DoTest(base, next)
                }
            }
        })

        test('two swaps', () => {
            for (let x0 = 0; x0 < 8; x0++) {
                for (let x1 = 0; x1 < x0; x1++) {
                    for (let y0 = 0; y0 < 8; y0++) {
                        for (let y1 = 0; y1 < y0; y1++) {
                            const base = [0, 1, 2, 3, 4, 5, 6, 7]
                            const next = [...base]
                            swap(next, x0, x1)
                            swap(next, y0, y1)
                            DoTest(base, next)
                        }
                    }
                }
            }
        })

        test('delete, swap, insert', () => {
            for (let d = 0; d < 8; d++) {
                for (let s0 = 0; s0 < 7; s0++) {
                    for (let s1 = 0; s1 < s0; s1++) {
                        for (let i = 0; i < 8; i++) {
                            const base = [0, 1, 2, 3, 4, 5, 6, 7]
                            const next = [...base]
                            deleteItem(next, d)
                            swap(next, s0, s1)
                            insert(next, i, 1000)
                            DoTest(base, next)
                        }
                    }
                }
            }
        })
    })

    describe('small changes after reverse', () => {
        test('two inserts', () => {
            for (let i0 = 0; i0 <= 8; i0++) {
                for (let i1 = 0; i1 <= 9; i1++) {
                    const base = [0, 1, 2, 3, 4, 5, 6, 7]
                    const next = [...base].reverse()
                    insert(next, i0, 1000)
                    insert(next, i1, 1001)
                    DoTest(base, next)
                }
            }
        })

        test('two deletes', () => {
            for (let d0 = 5; d0 < 8; d0++) {
                for (let d1 = 0; d1 < d0; d1++) {
                    const base = [0, 1, 2, 3, 4, 5, 6, 7]
                    const next = [...base].reverse()
                    deleteItem(next, d0)
                    deleteItem(next, d1)
                    DoTest(base, next)
                }
            }
        })

        test('two swaps', () => {
            for (let x0 = 0; x0 < 8; x0++) {
                for (let x1 = 0; x1 < x0; x1++) {
                    for (let y0 = 0; y0 < 8; y0++) {
                        for (let y1 = 0; y1 < y0; y1++) {
                            const base = [0, 1, 2, 3, 4, 5, 6, 7]
                            const next = [...base].reverse()
                            swap(next, x0, x1)
                            swap(next, y0, y1)
                            DoTest(base, next)
                        }
                    }
                }
            }
        })

        test('delete, swap, insert', () => {
            for (let d = 0; d < 8; d++) {
                for (let s0 = 0; s0 < 7; s0++) {
                    for (let s1 = 0; s1 < s0; s1++) {
                        for (let i = 0; i < 8; i++) {
                            const base = [0, 1, 2, 3, 4, 5, 6, 7]
                            const next = [...base].reverse()
                            deleteItem(next, d)
                            swap(next, s0, s1)
                            insert(next, i, 1000)
                            DoTest(base, next)
                        }
                    }
                }
            }
        })
    })

    describe('misc cases', () => {
        test('at least one empty', () => {
            DoTest([], [])
            DoTest([0], [])
            DoTest([], [0])
            DoTest([0, 1, 2], [])
            DoTest([], [0, 1, 2])
            DoTest([0, 1, 2, 3, 4, 5, 6, 7, 8], [])
            DoTest([], [0, 1, 2, 3, 4, 5, 6, 7, 8])
        })

        test('same', () => {
            DoTest([0], [0])
            DoTest([0, 1, 2], [0, 1, 2])
            DoTest([0, 1, 2, 3, 4, 5, 6, 7, 8], [0, 1, 2, 3, 4, 5, 6, 7, 8])
        })

        test('reverse', () => {
            DoTest([0], [0])
            DoTest([0, 1, 2], [2, 1, 0])
            DoTest([0, 1, 2, 3, 4, 5, 6, 7, 8], [8, 7, 6, 5, 4, 3, 2, 1, 0])
        })

        test('unusual keys', () => {
            const unusual = [
                undefined,
                null,
                () => {},
                [],
                true,
                Symbol('test'),
                BigInt(42)
            ]
            const reversed = [...unusual].reverse()
            DoTest(unusual, unusual)
            DoTest(unusual, reversed)
            DoTest(reversed, unusual)
            DoTest(reversed, reversed)
        })
    })

    describe('random shuffle tests', () => {
        test('shuffle keys directly', () => {
            const TEST_COUNT = 100;
            const KEY_COUNT = 512;
            const random = new Random(
                MersenneTwister19937.seedWithArray([0xfe775060])
            );
            for (let t = 0; t <= TEST_COUNT; t += 1) {
                const keys = new Array(KEY_COUNT).fill(0).map((_, i) => i)
                const shuffled = random.shuffle(keys.slice())
                DoTest(keys, shuffled)
            }
        })

        test('shuffle blocks of variable length', () => {
            const TEST_COUNT = 256;
            const BLOCK_COUNT = 128;
            const random = new Random(
                MersenneTwister19937.seedWithArray([0x7c180224])
            );
            for (let t = 0; t <= TEST_COUNT; t += 1) {
                const blocks = new Array(BLOCK_COUNT).fill(0).map((_, i) => i)
                const shuffledBlocks = random.shuffle(blocks.slice())
                const keys = blocks.flatMap(blockFromIndex)
                const shuffledKeys = shuffledBlocks.flatMap(blockFromIndex)
                DoTest(keys, shuffledKeys)
            }
            function blockFromIndex (i, _, __) {
                return new Array(1 + (i % 5))
                    .fill(0)
                    .map((_, x) => `${i}:${x}`)
            }
        })
    })

    function DoTest<T>(a: T[], b: T[]) {
        const differencer = new KeyDifferencer<T>()
        const diff = differencer.calculateDiffs(a, b)
        expect(differencer.applyDiff(a, diff.forward)).toEqual(b)
        expect(differencer.applyDiff(b, diff.reverse)).toEqual(a)
    }
    function insert<T>(a: T[], i: number, v: T) {
        a.splice(i, 0, v)
    }
    function deleteItem<T>(a: T[], i: number) {
        a.splice(i, 1)
    }
    function swap<T>(a: T[], i: number, j: number) {
        const tmp = a[i]
        a[i] = a[j]
        a[j] = tmp
    }
})
