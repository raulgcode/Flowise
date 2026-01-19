import { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { configureStore } from '@reduxjs/toolkit'
import { ConfigProvider } from '@/store/context/ConfigContext'
import { ErrorProvider } from '@/store/context/ErrorContext'

// Import real reducers from the application
import customizationReducer from '@/store/reducers/customizationReducer'
import canvasReducer from '@/store/reducers/canvasReducer'
import notifierReducer from '@/store/reducers/notifierReducer'
import dialogReducer from '@/store/reducers/dialogReducer'
import authReducer from '@/store/reducers/authSlice'

// Create a basic theme for testing
const testTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2'
        },
        secondary: {
            main: '#673ab7',
            light: '#9575cd',
            dark: '#512da8'
        },
        grey: {
            100: '#f5f5f5',
            200: '#eeeeee',
            300: '#e0e0e0',
            500: '#9e9e9e',
            600: '#757575',
            700: '#616161',
            900: '#212121'
        }
    }
})

// Create a test store using real reducers
export function createTestStore(preloadedState = {}) {
    return configureStore({
        reducer: {
            customization: customizationReducer,
            canvas: canvasReducer,
            notifier: notifierReducer,
            dialog: dialogReducer,
            auth: authReducer
        },
        preloadedState
    })
}

interface TestWrapperProps {
    children: ReactNode
    initialEntries?: MemoryRouterProps['initialEntries']
    store?: ReturnType<typeof createTestStore>
}

export const TestWrapper = ({ children, initialEntries = ['/login'], store = createTestStore() }: TestWrapperProps) => {
    return (
        <Provider store={store}>
            <MemoryRouter initialEntries={initialEntries}>
                <SnackbarProvider maxSnack={3}>
                    <ThemeProvider theme={testTheme}>
                        <CssBaseline />
                        <ConfigProvider>
                            <ErrorProvider>{children}</ErrorProvider>
                        </ConfigProvider>
                    </ThemeProvider>
                </SnackbarProvider>
            </MemoryRouter>
        </Provider>
    )
}

export default TestWrapper
