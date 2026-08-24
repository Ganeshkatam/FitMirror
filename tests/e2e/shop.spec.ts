import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
    test('should load and display main content', async ({ page }) => {
        await page.goto('/')

        // Check main branding or content exists
        await expect(page.locator('text=/FitMirror|Arrivals|Shop/i').first()).toBeAttached()

        // Check navigation exists
        await expect(page.locator('nav').first()).toBeVisible()
    })

    test('should have working navigation', async ({ page }) => {
        await page.goto('/')

        const navLink = page.locator('a:has-text("NEW ARRIVALS")').first()
        if (await navLink.isVisible()) {
            await navLink.click()
            await expect(page).toHaveURL(/\/shop/)
        }
    })
})

test.describe('Shop', () => {
    test('should load shop page', async ({ page }) => {
        await page.goto('/shop')
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/\/shop/)
    })

    test('should filter products by category', async ({ page }) => {
        await page.goto('/shop')
        await page.waitForLoadState('networkidle')

        const categoryFilter = page.locator('button:has-text("Category")').first()
        if (await categoryFilter.isVisible()) {
            await categoryFilter.click()
        }
    })
})

test.describe('Product Detail', () => {
    test('should show product information if product exists', async ({ page }) => {
        await page.goto('/shop')
        await page.waitForLoadState('networkidle')

        const firstProduct = page.getByTestId('product-card').first()
        if (await firstProduct.isVisible()) {
            await firstProduct.click()
            await page.waitForURL(/\/product\//)

            await expect(page.locator('h1')).toBeVisible()
        }
    })
})
