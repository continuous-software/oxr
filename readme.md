[![Build Status](https://travis-ci.org/continuous-software/open-exchange-rate-promise.svg?branch=master)](https://travis-ci.org/continuous-software/open-exchange-rate-promise)

#Open-exchange-rates-promise

A nodejs client factory for [open exchange rates](https://openexchangerates.org) API. API designed to return Promises, and possibility to plug a cache on top of it

##Install

`npm install --save open-exchange-rates-promise`

## Usage

Use the factory to create any number of client instances using your api keys

```Javascript

var oxr=require('open-exchange-rates-promise').factory;

var service=oxr({appId:'your app id'});

service.latest()
  .then(function(result){

  //do some stuff with the response from the openexchangerate.org api
  //var rates=result.rates etc

  });

```

## Error Handling

If the remote service returns an error, the promise is rejected with an instance of OxrError

```Javascript

var oxr=require('open-exchange-rates-promise').factory;
var OxrError=require('open-exchange-rates-promise').OxrError;

var service=oxr({appId:'wrong api key'});

service.latest()
  .then(function(result){
  })
  .catch(function(err){
      assert(err instanceof oxr.OxrError);
      assert.equal(err.status, 401);
      assert.equal(err.message, 'invalid_app_id');
      assert.equal(err.description, 'Invalid App ID provided - please sign up at https://openexchangerates.org/signup, or contact support@openexchangerates.org. Thanks!');
  });

```

##Service API

* latest(query, options) :
@params query - optional, a map of query string parameters to pass to the http call
@params options - optional, an object to merge with the http options sent to the remote API
@returns a promise with the latest rates from openexchangerates.org if resolved, reject with an Instance if the remote API returns an error response or with a standard Error otherwise.

* historical(date, query, options)
@params date - Date object or a String which would result in a valid Date object if called with the Date constructor
@params query - optional, a map of query string parameters to pass to the http call
@params options - optional, an object to merge with the http options sent to the remote API
@returns a promise with the rates at the requested date from openexchangerates.org if resolved, reject with an Instance if the remote API returns an error response or with a standard Error otherwise.

* currencies(query, options)
@params query - optional, a map of query string parameters to pass to the http call
@params options - optional, an object to merge with the http options sent to the remote API
@returns a promise with the list of currency codes from openexchangerates.org if resolved, reject with an Instance if the remote API returns an error response or with a standard Error otherwise.

##Cache decorator

You can also decorate your service with a cache. It must implement a <strong>get</strong> function and a <strong>put</strong> function which return promises

 ```Javascript

var dummyStore={
  get:function(){
    return Promise.resolve(this.value);
  },

  put:function(val){
    this.value=val;
    return Promise.resolve(this.value);
  }
}

var oxr=require('open-exchange-rates-promise');

var service = oxr.factory({appId:'APP_ID'});
service = oxr.cache({store:dummyStore,ttl:7*24*1000*3600}, service);

 ```
If the timestamp of the cached rates plus its time to live (ttl) in ms is higher than the current timestamp, the service will call the remote api,
otherwise, it will take the value from the cache.

Note: If an error is returned from the remote API, the service will fallback to the cached value if any, even if the cache has expired


## License

open-exchange-rates-promise module is under MIT license:

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