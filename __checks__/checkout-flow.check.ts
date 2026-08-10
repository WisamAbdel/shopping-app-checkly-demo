import { MultiStepCheck } from 'checkly/constructs'

new MultiStepCheck('checkout-flow', {
  name: 'Checkout flow (products -> cart -> cart check -> checkout)',
  code: {
    entrypoint: './checkout-flow.spec.ts',
  },
  /* Reachable only from the "local-demo" private location agent, same as the other checks. */
  locations: [],
  privateLocations: ['local-demo'],
})
