import { http, HttpResponse } from 'msw'

// Default successful login response
export const mockLoginSuccessResponse = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    token: 'mock-token-123',
    isAuthenticated: true,
    permissions: ['read', 'write'],
    features: ['feature1', 'feature2'],
    assignedWorkspaces: [{ id: 'workspace-1', name: 'Default Workspace' }]
}

// Default SSO providers response
export const mockSsoProvidersResponse = {
    providers: ['azure', 'google', 'auth0', 'github']
}

// Default permissions response
export const mockPermissionsResponse = {
    permissions: ['read', 'write', 'delete']
}

// Base URL for API calls
const API_BASE = '/api/v1'

export const handlers = [
    // POST /auth/login - Login endpoint
    http.post(`${API_BASE}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string }

        // Simulate different login scenarios based on credentials
        if (body.email === 'unverified@example.com') {
            return HttpResponse.json({ message: 'User Email Unverified' }, { status: 401 })
        }

        if (body.email === 'redirect@example.com') {
            return HttpResponse.json(
                {
                    message: 'Redirect required',
                    redirectUrl: true,
                    data: { redirectUrl: '/sso-redirect' }
                },
                { status: 401 }
            )
        }

        if (body.email === 'invalid@example.com' || body.password === 'wrongpassword') {
            return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        if (body.email === 'ratelimit@example.com') {
            return HttpResponse.json({ message: 'Too many requests', type: 'authentication_rate_limit' }, { status: 429 })
        }

        // Successful login
        return HttpResponse.json(mockLoginSuccessResponse)
    }),

    // POST /auth/resolve - Resolve login endpoint
    http.post(`${API_BASE}/auth/resolve`, async ({ request }) => {
        const body = (await request.json()) as { token: string }

        if (!body.token) {
            return HttpResponse.json({ message: 'Token required' }, { status: 400 })
        }

        return HttpResponse.json({
            resolved: true,
            user: mockLoginSuccessResponse
        })
    }),

    // GET /auth/permissions/:type - Get permissions by type
    http.get(`${API_BASE}/auth/permissions/:type`, ({ params }) => {
        const { type } = params

        if (type === 'invalid') {
            return HttpResponse.json({ message: 'Invalid permission type' }, { status: 400 })
        }

        return HttpResponse.json({
            type,
            permissions: mockPermissionsResponse.permissions
        })
    }),

    // GET /loginmethod/default - Get default login methods (SSO providers)
    http.get(`${API_BASE}/loginmethod/default`, () => {
        return HttpResponse.json(mockSsoProvidersResponse)
    }),

    // POST /account/resend-verification - Resend verification email
    http.post(`${API_BASE}/account/resend-verification`, async ({ request }) => {
        const body = (await request.json()) as { email: string }

        if (!body.email) {
            return HttpResponse.json({ message: 'Email is required' }, { status: 400 })
        }

        if (body.email === 'error@example.com') {
            return HttpResponse.json({ message: 'Failed to send verification email' }, { status: 500 })
        }

        return HttpResponse.json({
            success: true,
            message: 'Verification email sent'
        })
    }),

    // GET /platformsettings/settings - Platform settings (needed for ConfigContext)
    http.get(`${API_BASE}/platformsettings/settings`, () => {
        return HttpResponse.json({
            PLATFORM_TYPE: 'cloud'
        })
    }),

    // POST /auth/refreshToken - Token refresh endpoint
    http.post(`${API_BASE}/auth/refreshToken`, () => {
        return HttpResponse.json({
            id: 'user-123',
            token: 'new-mock-token-123'
        })
    })
]

// Handler overrides for specific test scenarios
export const loginErrorHandler = http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
})

export const loginUnverifiedHandler = http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({ message: 'User Email Unverified' }, { status: 401 })
})

export const loginRedirectHandler = http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json(
        {
            message: 'Redirect required',
            redirectUrl: true,
            data: { redirectUrl: '/sso-redirect' }
        },
        { status: 401 }
    )
})

export const noSsoProvidersHandler = http.get(`${API_BASE}/loginmethod/default`, () => {
    return HttpResponse.json({ providers: [] })
})

export const enterprisePlatformHandler = http.get(`${API_BASE}/platformsettings/settings`, () => {
    return HttpResponse.json({
        PLATFORM_TYPE: 'enterprise'
    })
})

export const openSourcePlatformHandler = http.get(`${API_BASE}/platformsettings/settings`, () => {
    return HttpResponse.json({
        PLATFORM_TYPE: 'opensource'
    })
})

export const resendVerificationErrorHandler = http.post(`${API_BASE}/account/resend-verification`, () => {
    return HttpResponse.json({ message: 'Failed to send verification email' }, { status: 500 })
})
