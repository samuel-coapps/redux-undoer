// Copyright (c) 2017-present, Global Strategies
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

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
