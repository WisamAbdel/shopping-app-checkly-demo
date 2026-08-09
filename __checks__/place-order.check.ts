import { BrowserCheck } from 'checkly/constructs'

new BrowserCheck('place-order', {
  name: 'Place order flow',
  code: {
    entrypoint: './place-order.spec.ts',
  },
  /* Demo app is only reachable on the local Docker host, so this runs from the
   * "local-demo" private location agent instead of Checkly's cloud locations. */
  locations: [],
  privateLocations: ['local-demo'],
})
