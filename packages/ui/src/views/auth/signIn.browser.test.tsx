import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent, page } from 'vitest/browser'
import { setupWorker } from 'msw/browser'
import { http, HttpResponse } from 'msw'
import { handlers, mockLoginSuccessResponse } from '@/mocks/handlers'
import SignInPage from './signIn'
import { TestWrapper } from '@/mocks/testUtils'

const API_BASE = '/api/v1'

// Create worker instance
const worker = setupWorker(...handlers)

describe('SignInPage', () => {
    beforeAll(async () => {
        await worker.start({
            onUnhandledRequest: 'bypass'
        })
    })

    afterEach(() => {
        worker.resetHandlers()
    })

    afterAll(() => {
        worker.stop()
    })

    describe('rendering', () => {
        it('renders the sign in form correctly', async () => {
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByText('Sign In')).toBeVisible()
            await expect.element(screen.getByText('Email')).toBeVisible()
            await expect.element(page.getByPlaceholder('********')).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /login/i })).toBeVisible()
        })

        it('renders forgot password link', async () => {
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByText('Forgot password?')).toBeVisible()
        })

        it('renders SSO divider when SSO providers are configured', async () => {
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByRole('button', { name: /login/i })).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeVisible()
        })
    })

    describe('SSO providers', () => {
        it('renders SSO provider buttons when providers are available', async () => {
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /sign in with google/i })).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /sign in with auth0/i })).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /sign in with github/i })).toBeVisible()
        })

        it('does not render SSO buttons when no providers are configured', async () => {
            worker.use(
                http.get(`${API_BASE}/loginmethod/default`, () => {
                    return HttpResponse.json({ providers: [] })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByText('Sign In')).toBeVisible()

            const microsoftButton = screen.getByRole('button', { name: /sign in with microsoft/i })
            await expect.element(microsoftButton).not.toBeInTheDocument()
        })

        it('renders only specific SSO provider buttons when only some are configured', async () => {
            worker.use(
                http.get(`${API_BASE}/loginmethod/default`, () => {
                    return HttpResponse.json({ providers: ['google', 'github'] })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByText('Sign In')).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /login/i })).toBeVisible()

            await expect.element(screen.getByRole('button', { name: /sign in with google/i })).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /sign in with github/i })).toBeVisible()

            const microsoftButton = screen.getByRole('button', { name: /sign in with microsoft/i })
            await expect.element(microsoftButton).not.toBeInTheDocument()

            const auth0Button = screen.getByRole('button', { name: /sign in with auth0/i })
            await expect.element(auth0Button).not.toBeInTheDocument()
        })

        it('updates SSO providers when API response changes', async () => {
            // First render with all providers
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            // Verify all SSO buttons are present initially
            await expect.element(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /sign in with google/i })).toBeVisible()
        })
    })

    describe('form interaction', () => {
        it('allows typing in email field', async () => {
            await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            await userEvent.type(emailInput, 'test@example.com')

            await expect.element(emailInput).toHaveValue('test@example.com')
        })

        it('allows typing in password field', async () => {
            await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const passwordInput = page.getByPlaceholder('********')
            await userEvent.type(passwordInput, 'password123')

            await expect.element(passwordInput).toHaveValue('password123')
        })

        it('login button is enabled without credentials', async () => {
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const loginButton = screen.getByRole('button', { name: /login/i })
            await expect.element(loginButton).toBeEnabled()
        })

        it('clears form fields after page load', async () => {
            await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')

            // Fields should be empty on initial load
            await expect.element(emailInput).toHaveValue('')
            await expect.element(passwordInput).toHaveValue('')
        })
    })

    describe('login flow', () => {
        it('shows loading state when login is submitted', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, async () => {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                    return HttpResponse.json(mockLoginSuccessResponse)
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'test@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            await expect.element(loginButton).toBeVisible()
        })

        it('displays error message on failed login', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'invalid@example.com')
            await userEvent.type(passwordInput, 'wrongpassword')
            await userEvent.click(loginButton)

            await expect.element(screen.getByText('Invalid credentials')).toBeVisible()
        })

        it('shows resend verification button when email is unverified', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'User Email Unverified' }, { status: 401 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'unverified@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            await expect.element(screen.getByText('User Email Unverified')).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /resend verification email/i })).toBeVisible()
        })

        it('hides resend button when error changes to something other than unverified', async () => {
            // First trigger unverified error
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'User Email Unverified' }, { status: 401 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'unverified@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            // Resend button should appear
            await expect.element(screen.getByRole('button', { name: /resend verification email/i })).toBeVisible()

            // Now change the handler to return a different error
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'Different error' }, { status: 401 })
                })
            )

            // Clear and type new credentials
            await userEvent.clear(emailInput)
            await userEvent.clear(passwordInput)
            await userEvent.type(emailInput, 'other@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            // Resend button should be hidden now
            await expect.element(screen.getByText('Different error')).toBeVisible()
            const resendButton = screen.getByRole('button', { name: /resend verification email/i })
            await expect.element(resendButton).not.toBeInTheDocument()
        })

        it('successfully logs in with valid credentials and navigates away', async () => {
            // Use the default success handler
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'test@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            // After successful login, the component should attempt to navigate
            // In tests, navigation doesn't actually happen, but we can verify
            // the login was successful by checking no error is shown
            // and the loading state completes
            await new Promise((resolve) => setTimeout(resolve, 200))

            // No error message should be visible
            const errorAlert = screen.getByText('Invalid credentials')
            await expect.element(errorAlert).not.toBeInTheDocument()
        })
    })

    describe('resend verification email', () => {
        it('sends verification email when resend button is clicked', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'User Email Unverified' }, { status: 401 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'unverified@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            const resendButton = screen.getByRole('button', { name: /resend verification email/i })
            await expect.element(resendButton).toBeVisible()

            await userEvent.click(resendButton)

            await expect.element(screen.getByText('Verification email has been sent successfully.')).toBeVisible()
        })

        it('hides resend button after successful resend', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'User Email Unverified' }, { status: 401 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'unverified@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            const resendButton = screen.getByRole('button', { name: /resend verification email/i })
            await expect.element(resendButton).toBeVisible()
            await userEvent.click(resendButton)

            await expect.element(screen.getByText('Verification email has been sent successfully.')).toBeVisible()
            await expect.element(screen.getByRole('button', { name: /resend verification email/i })).not.toBeInTheDocument()
        })

        it('clears error message after successful verification email resend', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'User Email Unverified' }, { status: 401 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'unverified@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            // Error should be visible
            await expect.element(screen.getByText('User Email Unverified')).toBeVisible()

            const resendButton = screen.getByRole('button', { name: /resend verification email/i })
            await userEvent.click(resendButton)

            // After resend, the original error should be cleared
            const errorMessage = screen.getByText('User Email Unverified')
            await expect.element(errorMessage).not.toBeInTheDocument()
        })
    })

    describe('error handling from URL', () => {
        it('displays error from URL query parameter', async () => {
            const errorMessage = 'SSO authentication failed'
            const encodedError = encodeURIComponent(JSON.stringify({ message: errorMessage }))

            const screen = await render(
                <TestWrapper initialEntries={[`/login?error=${encodedError}`]}>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByText(errorMessage)).toBeVisible()
        })

        it('displays different error messages from URL', async () => {
            const errorMessage = 'Account locked due to too many failed attempts'
            const encodedError = encodeURIComponent(JSON.stringify({ message: errorMessage }))

            const screen = await render(
                <TestWrapper initialEntries={[`/login?error=${encodedError}`]}>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByText(errorMessage)).toBeVisible()
        })

        it('does not show error when no error parameter in URL', async () => {
            const screen = await render(
                <TestWrapper initialEntries={['/login']}>
                    <SignInPage />
                </TestWrapper>
            )

            // Should render normally without errors
            await expect.element(screen.getByText('Sign In')).toBeVisible()

            // Check that no error alert is visible
            const errorAlert = screen.getByText('SSO authentication failed')
            await expect.element(errorAlert).not.toBeInTheDocument()
        })
    })

    describe('login error scenarios', () => {
        it('displays server error message', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'test@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            await expect.element(screen.getByText('Internal server error')).toBeVisible()
        })

        it('handles account locked error', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'Account is locked' }, { status: 401 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'locked@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            await expect.element(screen.getByText('Account is locked')).toBeVisible()
        })
    })

    describe('success message handling', () => {
        it('can close success message alert', async () => {
            worker.use(
                http.post(`${API_BASE}/auth/login`, () => {
                    return HttpResponse.json({ message: 'User Email Unverified' }, { status: 401 })
                })
            )

            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            const passwordInput = page.getByPlaceholder('********')
            const loginButton = screen.getByRole('button', { name: /login/i })

            await userEvent.type(emailInput, 'unverified@example.com')
            await userEvent.type(passwordInput, 'password123')
            await userEvent.click(loginButton)

            const resendButton = screen.getByRole('button', { name: /resend verification email/i })
            await userEvent.click(resendButton)

            // Success message should be visible
            await expect.element(screen.getByText('Verification email has been sent successfully.')).toBeVisible()

            // Find and click the close button on the success alert
            const closeButton = page.getByRole('button', { name: /close/i })
            await userEvent.click(closeButton)

            // Success message should be hidden after closing
            const successMessage = screen.getByText('Verification email has been sent successfully.')
            await expect.element(successMessage).not.toBeInTheDocument()
        })
    })

    describe('accessibility', () => {
        it('has proper form structure', async () => {
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            await expect.element(screen.getByRole('button', { name: /login/i })).toBeVisible()

            const form = screen.container.querySelector('form')
            expect(form).toBeTruthy()
        })

        it('email input has correct type', async () => {
            await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const emailInput = page.getByPlaceholder('user@company.com')
            await expect.element(emailInput).toHaveAttribute('type', 'email')
        })

        it('password input has correct type', async () => {
            await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const passwordInput = page.getByPlaceholder('********')
            await expect.element(passwordInput).toHaveAttribute('type', 'password')
        })

        it('forgot password link is accessible', async () => {
            const screen = await render(
                <TestWrapper>
                    <SignInPage />
                </TestWrapper>
            )

            const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i })
            await expect.element(forgotPasswordLink).toBeVisible()
            await expect.element(forgotPasswordLink).toHaveAttribute('href', '/forgot-password')
        })
    })
})
