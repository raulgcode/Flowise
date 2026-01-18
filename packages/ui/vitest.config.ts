import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    // @ts-expect-error - vite version mismatch between @vitejs/plugin-react and vitest
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    include: ['**/*.vi.test.{ts,tsx,js,jsx}'],
                    exclude: ['**/node_modules/**', '**/build/**'],
                    environment: 'node',
                    globals: true
                }
            },
            {
                extends: true,
                test: {
                    name: 'browser',
                    include: ['**/*.browser.test.{ts,tsx,js,jsx}'],
                    exclude: ['**/node_modules/**', '**/build/**'],
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        instances: [{ browser: 'chromium' }],
                        headless: true
                    }
                }
            }
        ]
    }
})
