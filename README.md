[![Build Status](https://travis-ci.org/continuous-software/oxr.svg?branch=master)](https://travis-ci.org/continuous-software/oxr) [![Coverage Status](https://coveralls.io/repos/continuous-software/oxr/badge.svg?branch=master)](https://coveralls.io/r/continuous-software/oxr?branch=master)

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
})

service.latest().then(function(result){
  var rates = result.rates
  console.log(rates)
})

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

## Cache Decorator
You can also decorate the service methods with a cache.  

**@params method** *(optional)* - the method to decorate.<br>
Defaults to *latest*

**@params store**
- **@params store.get(...methodArgs)** - called before a request is sent to the remote API, use this getter to retrieve a value from the cache. can resolve a promise.
- **@params store.put(value, ...methodArgs)** - called after the request completed, use this setter to store the value in cache. can resolve a promise.

**@params tll** *(optional)* - If the timestamp of the cached rates plus its time to live (ttl) in ms is higher than the current timestamp, the service will call the remote API, otherwise, it will take the value from the cache.<br>
Defaults to 24 hours for *latest* and to Infinity for *currencies* and *historical*

If an error returned from the remote API, the service will fall back to the cached value if any, even if the cache has expired.

**@returns** - decorated service


 ```javascript
var oxr = require('oxr')
var service = oxr.factory({
  appId: process.env.OXR_APP_ID || '<YOUR_APP_ID>'
})

service = oxr.cache({
  method: 'latest',
  ttl: 7 * 24 * 1000 * 3600,
  store: {
    get: function () {
      return Promise.resolve(this.value)
    },
    put: function (value) {
      this.value = value
      return Promise.resolve(this.value)
    }
  }
}, service)
```

You can decorate the service more than once, with different cache strategy for each method
```js
service = oxr.cache({
  method: 'historical',
  store: {
    cache: {},
    get: function (date) {
      return this.cache[date];
    },
    put: function (value, date) {
      this.cache[date] = value;
    }
  }
}, service)


// note how the arguments that you pass to the decorated method
// are also passed to `get` and `put`
service.historical('2017-11-16')
  .then((value) => { ... })
```





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

## Contributing

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

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
