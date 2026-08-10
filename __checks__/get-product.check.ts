import { ApiCheck, AssertionBuilder } from 'checkly/constructs'

new ApiCheck('get-product', {
  name: 'Get product (National Park Foundation Explorascope)',
  /* Reachable only from the "local-demo" private location agent, same as place-order. */
  locations: [],
  privateLocations: ['local-demo'],
  request: {
    url: 'http://host.docker.internal:8080/api/products/OLJCESPC7Z?currencyCode=USD',
    method: 'GET',
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.id').equals('OLJCESPC7Z'),
      AssertionBuilder.jsonBody('$.name').equals('National Park Foundation Explorascope'),
      AssertionBuilder.responseTime().lessThan(2000),
    ],
  },
})
