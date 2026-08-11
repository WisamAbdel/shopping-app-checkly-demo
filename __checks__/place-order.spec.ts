import { test, expect } from '@playwright/test'

test('place order', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Go Shopping' }).click()
  await page.getByRole('link', { name: 'Solar System Color Imager $' }).click()
  await page.getByRole('main').getByRole('combobox').selectOption('2')
  await page.getByRole('button', { name: 'cart Add To Cart' }).click()
  await page.getByRole('button', { name: 'Place Order' }).click()

  await expect(page.getByText('Your order is complete!')).toBeVisible({ timeout: 10000 })
})
