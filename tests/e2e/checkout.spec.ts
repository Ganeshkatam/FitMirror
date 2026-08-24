import { test, expect } from '@playwright/test'

test.describe('Cart & Checkout Flow', () => {
    test('should show cart page', async ({ page }) => {
        await page.goto('/cart')
        await page.waitForLoadState('networkidle')

        const cartContent = page.locator('text=/cart|bag|shopping/i').first()
        await expect(cartContent).toBeVisible()
    })

    test('should show checkout page when navigating', async ({ page }) => {
        await page.goto('/checkout')
        await page.waitForLoadState('networkidle')

        const url = page.url()
        expect(url.includes('/checkout') || url.includes('/login') || url.includes('/cart')).toBeTruthy()
    })
})
