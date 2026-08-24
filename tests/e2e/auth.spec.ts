import { test, expect } from '@playwright/test'

test.describe('Authentication & Protected Routes', () => {
    test('should show login page', async ({ page }) => {
        await page.goto('/login')

        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('input[type="password"]')).toBeVisible()
        await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
    })

    test('should show signup page', async ({ page }) => {
        await page.goto('/signup')

        await expect(page.getByText('Create Account').first()).toBeVisible()
        await expect(page.locator('input[name="email"]')).toBeVisible()
        await expect(page.locator('input[name="password"]')).toBeVisible()
    })

    test('should redirect unauthenticated users from account', async ({ page }) => {
        await page.goto('/account')
        await page.waitForURL(/\/login/)
        expect(page.url()).toContain('/login')
    })

    test('should redirect unauthenticated users from checkout when empty', async ({ page }) => {
        await page.goto('/checkout')
        await page.waitForURL(/\/(login|cart|$)/)
    })
})
