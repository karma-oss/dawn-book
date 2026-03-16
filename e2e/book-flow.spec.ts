import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })
  test('should show login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('[data-karma-test-id="email-input"]')).toBeVisible()
  })
})

test.describe('Public booking page', () => {
  test('should load public booking page', async ({ page }) => {
    await page.goto('/book/test-org-id')
    await page.waitForTimeout(2000)
    // Page should load without crashing
    expect(page.url()).toContain('/book/')
  })
})

test.describe('API - unauthorized', () => {
  test('should reject unauthenticated services API', async ({ request }) => {
    expect((await request.get('/api/services')).status()).toBe(401)
  })
  test('should reject unauthenticated bookings API', async ({ request }) => {
    expect((await request.get('/api/bookings')).status()).toBe(401)
  })
})
