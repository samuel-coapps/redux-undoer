import { waitFor } from './testUtil'

describe('waitFor', () => {
    test('timeout', async () => {
        const error = new Error('Test timeout error.')
        await expect(waitFor(() => {
            throw error
        })).rejects.toThrow(error)
    })
})
