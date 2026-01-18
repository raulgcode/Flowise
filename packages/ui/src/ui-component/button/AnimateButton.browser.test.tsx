import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import AnimateButton from './AnimateButton'

describe('AnimateButton', () => {
    describe('rendering', () => {
        it('renders children correctly and is visible', async () => {
            const screen = await render(
                <AnimateButton>
                    <button>Click me</button>
                </AnimateButton>
            )

            await expect.element(screen.getByRole('button', { name: /click me/i })).toBeVisible()
        })

        it('renders with default scale type and children are accessible', async () => {
            const screen = await render(
                <AnimateButton>
                    <span data-testid='content'>Test Content</span>
                </AnimateButton>
            )

            await expect.element(screen.getByTestId('content')).toBeVisible()
            await expect.element(screen.getByTestId('content')).toHaveTextContent('Test Content')
        })

        it('renders with rotate type and is visible', async () => {
            const screen = await render(
                <AnimateButton type='rotate'>
                    <span>Rotating</span>
                </AnimateButton>
            )

            await expect.element(screen.getByText('Rotating')).toBeVisible()
        })
    })

    describe('slide animation directions', () => {
        it('renders slide type with up direction and is visible', async () => {
            const screen = await render(
                <AnimateButton type='slide' direction='up'>
                    <button>Slide Up</button>
                </AnimateButton>
            )

            await expect.element(screen.getByRole('button', { name: /slide up/i })).toBeVisible()
        })

        it('renders slide type with down direction and is visible', async () => {
            const screen = await render(
                <AnimateButton type='slide' direction='down'>
                    <button>Slide Down</button>
                </AnimateButton>
            )

            await expect.element(screen.getByRole('button', { name: /slide down/i })).toBeVisible()
        })

        it('renders slide type with left direction and is visible', async () => {
            const screen = await render(
                <AnimateButton type='slide' direction='left'>
                    <button>Slide Left</button>
                </AnimateButton>
            )

            await expect.element(screen.getByRole('button', { name: /slide left/i })).toBeVisible()
        })

        it('renders slide type with right direction and is visible', async () => {
            const screen = await render(
                <AnimateButton type='slide' direction='right'>
                    <button>Slide Right</button>
                </AnimateButton>
            )

            await expect.element(screen.getByRole('button', { name: /slide right/i })).toBeVisible()
        })
    })

    describe('scale configuration', () => {
        it('renders with custom scale as number and is visible', async () => {
            const screen = await render(
                <AnimateButton type='scale' scale={1.2}>
                    <button>Custom Scale</button>
                </AnimateButton>
            )

            await expect.element(screen.getByRole('button', { name: /custom scale/i })).toBeVisible()
        })

        it('renders with custom scale as object and is visible', async () => {
            const screen = await render(
                <AnimateButton type='scale' scale={{ hover: 1.1, tap: 0.95 }}>
                    <button>Object Scale</button>
                </AnimateButton>
            )

            await expect.element(screen.getByRole('button', { name: /object scale/i })).toBeVisible()
        })
    })

    describe('user interaction', () => {
        it('button inside AnimateButton is clickable', async () => {
            let clicked = false
            const screen = await render(
                <AnimateButton>
                    <button
                        onClick={() => {
                            clicked = true
                        }}
                    >
                        Click Test
                    </button>
                </AnimateButton>
            )

            const button = screen.getByRole('button', { name: /click test/i })
            await expect.element(button).toBeVisible()

            await userEvent.click(button)
            expect(clicked).toBe(true)
        })

        it('button remains accessible after hover interaction', async () => {
            const screen = await render(
                <AnimateButton type='scale' scale={{ hover: 1.1, tap: 0.9 }}>
                    <button>Hover Test</button>
                </AnimateButton>
            )

            const button = screen.getByRole('button', { name: /hover test/i })
            await expect.element(button).toBeVisible()

            await userEvent.hover(button)
            await expect.element(button).toBeVisible()
        })

        it('slide animation button responds to hover', async () => {
            const screen = await render(
                <AnimateButton type='slide' direction='up' offset={15}>
                    <button>Slide Hover</button>
                </AnimateButton>
            )

            const button = screen.getByRole('button', { name: /slide hover/i })
            await expect.element(button).toBeVisible()

            await userEvent.hover(button)
            await expect.element(button).toBeVisible()
        })
    })

    describe('accessibility', () => {
        it('preserves button accessibility attributes', async () => {
            const screen = await render(
                <AnimateButton>
                    <button aria-label='Accessible button' disabled={false}>
                        Accessible
                    </button>
                </AnimateButton>
            )

            const button = screen.getByRole('button', { name: /accessible button/i })
            await expect.element(button).toBeVisible()
            await expect.element(button).toBeEnabled()
        })

        it('disabled button state is preserved', async () => {
            const screen = await render(
                <AnimateButton>
                    <button disabled>Disabled Button</button>
                </AnimateButton>
            )

            const button = screen.getByRole('button', { name: /disabled button/i })
            await expect.element(button).toBeVisible()
            await expect.element(button).toBeDisabled()
        })

        it('link inside AnimateButton is accessible', async () => {
            const screen = await render(
                <AnimateButton>
                    <a href='#test'>Test Link</a>
                </AnimateButton>
            )

            const link = screen.getByRole('link', { name: /test link/i })
            await expect.element(link).toBeVisible()
            await expect.element(link).toHaveAttribute('href', '#test')
        })
    })
})
