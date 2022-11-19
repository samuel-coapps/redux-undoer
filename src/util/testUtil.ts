// ---------------------------------------------------------------------------
// GLOBAL STRATEGIES, ALBANY, CALIFORNIA
// NOVIGUIDE 2.0
// (c) 2017-present Global Strategies
// ---------------------------------------------------------------------------
// Point-of-care clinical decision support
// ---------------------------------------------------------------------------

export function waitFor(
    condition: () => void,
    options?: { pollIntervalMillis: number; timeoutMillis: number }
) {
    const timeout = options?.timeoutMillis ?? 1000
    const pollInterval = options?.pollIntervalMillis ?? 50

    return new Promise<void>(async (resolve, reject) => {
        let timedOut = false
        let lastError = new Error('Condition not realized before timeout.')
        const timeoutId = setTimeout(() => {
            timedOut = true
            reject(lastError)
        }, timeout)

        while (true) {
            let conditionHolds = false

            try {
                condition()
                conditionHolds = true
            } catch (e) {
                lastError = e
                await new Promise((endWait) =>
                    setTimeout(endWait, pollInterval)
                )
            }

            if (conditionHolds) {
                clearTimeout(timeoutId)
                resolve()
            }

            if (conditionHolds || timedOut) {
                return
            }
        }
    })
}
