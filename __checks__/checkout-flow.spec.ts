import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test('checkout flow', async ({ request }) => {
  const sessionId = randomUUID()

  const product = await test.step('GET /api/products - pick a product', async () => {
    const res = await request.get('/api/products?currencyCode=USD')
    expect(res.ok()).toBeTruthy()
    const products = await res.json()
    expect(products.length).toBeGreaterThan(0)
    return products[0]
  })

  await test.step('POST /api/cart - add item to a new session', async () => {
    const res = await request.post('/api/cart', {
      data: {
        userId: sessionId,
        item: { productId: product.id, quantity: 1 },
      },
    })
    expect(res.ok()).toBeTruthy()
  })

  await test.step('GET /api/cart - assert item is present', async () => {
    const res = await request.get(`/api/cart?sessionId=${sessionId}&currencyCode=USD`)
    expect(res.ok()).toBeTruthy()
    const cart = await res.json()
    const item = cart.items.find((i: { productId: string }) => i.productId === product.id)
    expect(item).toBeTruthy()
  })

  await test.step('POST /api/checkout - place the order', async () => {
    const res = await request.post('/api/checkout?currencyCode=USD', {
      data: {
        userId: sessionId,
        userCurrency: 'USD',
        address: {
          streetAddress: '1600 Amphitheatre Parkway',
          city: 'Mountain View',
          state: 'CA',
          country: 'United States',
          zipCode: '94043',
        },
        email: 'someone@example.com',
        creditCard: {
          creditCardNumber: '4432-8015-6152-0454',
          creditCardCvv: 672,
          creditCardExpirationYear: 2030,
          creditCardExpirationMonth: 1,
        },
      },
    })
    expect(res.ok()).toBeTruthy()
    const order = await res.json()
    expect(order.orderId).toBeTruthy()
    expect(order.error).toBeUndefined()
  })
})
