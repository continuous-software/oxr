![Build Status](https://img.shields.io/travis/continuous-software/oxr.svg) ![Coverage Status](https://img.shields.io/coveralls/continuous-software/oxr.svg) ![Dependencies Status](https://img.shields.io/david/continuous-software/oxr.svg)

# Open eXchange Rates

A Node.js client for the [Open Exchange Rates](https://openexchangerates.org) API.  
Our client is designed to return Promises and provide a flexible caching capability.

## Install

`npm install --save oxr`

## Usage

Use the factory to create any number of client instances using your API keys

```javascript
var oxr = require('oxr')
var service = oxr.factory({
  appId: process.env.OXR_APP_ID || '<YOUR_APP_ID>'
});

service.latest().then(function(result){
  var rates = result.rates
  console.log(rates);
});

```

## Service API

* [latest(query, options)](https://github.com/continuous-software/oxr#latestquery-options)
* [historical(date, query, options)](https://github.com/continuous-software/oxr#historicaldate-query-options)
* [currencies(query, options)](https://github.com/continuous-software/oxr#currenciesquery-options)

### latest(query, options)  
**@params query** *(optional)* - A map of query string parameters to pass to the http call.  
**@params options** *(optional)*- An object to merge with the http options sent to the remote API.  
**@returns** - A promise with the latest rates from openexchangerates.org if resolved, reject with an Instance if the remote API returns an error response or with a standard Error otherwise.

### historical(date, query, options)  
**@params date** - Date object or a String which would result in a valid Date object if called with the Date constructor.  
**@params query** *(optional)* - A map of query string parameters to pass to the http call.  
**@params options** *(optional)* - An object to merge with the http options sent to the remote API.  
**@returns** - A promise with the rates at the requested date from openexchangerates.org if resolved, reject with an Instance if the remote API returns an error response or with a standard Error otherwise.

### currencies(query, options)  
**@params query** *(optional)* - A map of query string parameters to pass to the http call.  
**@params options** *(optional)* - An object to merge with the http options sent to the remote API.  
**@returns** - A promise with the list of currency codes from openexchangerates.org if resolved, reject with an Instance if the remote API returns an error response or with a standard Error otherwise.

## Cache

You can also decorate your service with a cache.  
It must implement a **get** and a **put** functions which return Promises.

 ```javascript
var oxr = require('oxr');
var service = oxr.factory({
  appId: process.env.OXR_APP_ID || '<YOUR_APP_ID>'
});

service = oxr.cache({
  store: {
    get: function () {
      return Promise.resolve(this.value)
    },
    put: function (value) {
      this.value = value
      return Promise.resolve(this.value)
    }
  },
  ttl: 7 * 24 * 1000 * 3600
}, service);
```

If the timestamp of the cached rates plus its time to live (ttl) in ms is higher than the current timestamp, the service will call the remote api, otherwise, it will take the value from the cache.  
**Note:** If an error is returned from the remote API, the service will fallback to the cached value if any, even if the cache has expired.


## Error Handling

If the remote service returns an error, Promises are rejected with an instance of OxrError.

```javascript
var oxr = require('oxr')
var service = oxr.factory({
  appId: '<WRONG_APP_ID>'
})

service.latest().catch(function (error) {
  assert(error instanceof oxr.OxrError)
  assert.equal(error.status, 401)
  assert.equal(error.message, 'invalid_app_id')
  assert.equal(error.description, 'Invalid App ID provided - please sign up at https://openexchangerates.org/signup, or contact support@openexchangerates.org. Thanks!')
})
```

## License

This module is distributed under the MIT license.

> Copyright (C) 2014 Laurent Renard.
>
> Permission is hereby granted, free of charge, to any person
> obtaining a copy of this software and associated documentation files
> (the "Software"), to deal in the Software without restriction,
> including without limitation the rights to use, copy, modify, merge,
> publish, distribute, sublicense, and/or sell copies of the Software,
> and to permit persons to whom the Software is furnished to do so,
> subject to the following conditions:
>
> The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
> BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
> ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
> CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
