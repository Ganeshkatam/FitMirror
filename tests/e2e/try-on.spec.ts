import { test, expect } from '@playwright/test'

test.describe('Virtual Try-On Experience', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/try-on')
    })

    test('should load try-on interface', async ({ page }) => {
        await expect(page.getByText('Virtual Fitting Room')).toBeVisible()
        await expect(page.getByRole('tab', { name: 'Tops' })).toBeVisible()
        await expect(page.getByRole('tab', { name: 'Bottoms' })).toBeVisible()
        await expect(page.getByRole('tab', { name: 'Dresses' })).toBeVisible()
    })

    test('should have reset and exit controls', async ({ page }) => {
        await expect(page.getByText('Exit')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()
    })

    test('should allow switching garment categories', async ({ page }) => {
        const bottomsTab = page.getByRole('tab', { name: 'Bottoms' })
        await bottomsTab.click()
        await expect(bottomsTab).toHaveAttribute('data-state', 'active')
    })
})
