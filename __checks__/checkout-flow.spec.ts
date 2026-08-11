import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test('checkout flow', async ({ request }) => {
  const sessionId = randomUUID()

  const product = await test.step('GET /api/products - pick a product', async () => {
    const res = await request.get('/api/products?currencyCode=USD')
    const body = await res.text()
    expect(res.status(), `GET /api/products -> ${res.status()}: ${body}`).toBe(200)
    const products = JSON.parse(body)
    expect(products.length, `expected at least one product, got: ${body}`).toBeGreaterThan(0)
    return products[0]
  })

  await test.step('POST /api/cart - add item to a new session', async () => {
    const res = await request.post('/api/cart', {
      data: {
        userId: sessionId,
        item: { productId: product.id, quantity: 1 },
      },
    })
    const body = await res.text()
    expect(res.status(), `POST /api/cart -> ${res.status()}: ${body}`).toBe(200)
  })

  await test.step('GET /api/cart - assert item is present', async () => {
    const res = await request.get(`/api/cart?sessionId=${sessionId}&currencyCode=USD`)
    const body = await res.text()
    expect(res.status(), `GET /api/cart -> ${res.status()}: ${body}`).toBe(200)
    const cart = JSON.parse(body)
    const item = cart.items.find((i: { productId: string }) => i.productId === product.id)
    expect(item, `product ${product.id} not found in cart: ${body}`).toBeTruthy()
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
    const body = await res.text()
    expect(res.status(), `POST /api/checkout -> ${res.status()}: ${body}`).toBe(200)
    const order = JSON.parse(body)
    expect(order.orderId, `no orderId in response: ${body}`).toBeTruthy()
    expect(order.error, `checkout returned an error: ${body}`).toBeUndefined()
  })
})
