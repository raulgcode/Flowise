import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function setupMSW() {
    await worker.start({
        onUnhandledRequest: 'bypass'
    })
}

export function resetMSWHandlers() {
    worker.resetHandlers()
}

export function stopMSW() {
    worker.stop()
}

// Setup hooks for tests
export function useMSW() {
    beforeAll(async () => {
        await setupMSW()
    })

    afterEach(() => {
        resetMSWHandlers()
    })

    afterAll(() => {
        stopMSW()
    })

    return worker
}
