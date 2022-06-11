import { HasKey } from './util'

test('HasKey', () => {
    const frozen = Object.freeze({ a: 0 })
    expect(HasKey(frozen, 'a')).toBe(true)
    expect(HasKey(frozen, 'b')).toBe(false)
    expect(HasKey(frozen, 'hasOwnProperty')).toBe(false)

    const nullPrototype = Object.create(null)
    expect(HasKey(nullPrototype, 'a')).toBe(false)
})
