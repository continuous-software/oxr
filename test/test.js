'use strict'

/* global describe, beforeEach, it, afterEach */

var oxr = require('../index.js')
var assert = require('assert')
var cache = require('../lib/cache.js')
var Promise = require('bluebird')
var nock = require('nock')


describe('Open exchange rate promise service', function () {
  var service

  beforeEach(function () {

    nock.enableNetConnect('openexchangerates.org')

    service = oxr.factory({
      appId: process.env.OXR_APP_ID || '<YOUR_APP_ID>',
      protocol: process.env.OXR_PROTOCOL || 'https'
    })
  })

  it('should get the latest rates', function (done) {
    service.latest().then(function (results) {
      assert(results.disclaimer)
      assert(results.license)
      assert(results.base)
      assert(results.rates)
      assert(results.timestamp)
      done()
    }).catch(function (error) {
      console.log('Error:', error)
      done(error)
    })
  })

  it('parse API error response', function (done) {
    service.latest({
      app_id: '<INVALID_APP_ID>'
    }).then(function () {
      done('should not get here')
    }, function (err) {
      assert(err instanceof oxr.OxrError)
      assert.equal(err.status, 401)
      assert.equal(err.message, 'invalid_app_id')
      assert.equal(err.description, 'Invalid App ID provided. Please sign up at https://openexchangerates.org/signup, or contact support@openexchangerates.org.')
      done()
    })
  })

  it('should get historical data with a date object', function (done) {
    service.historical(new Date(Date.now() - 24 * 3600 * 7))
      .then(function (results) {
        assert(results.disclaimer)
        assert(results.license)
        assert(results.base)
        assert(results.rates)
        done()
      }).catch(function (error) {
        done(error)
      })
  })

  it('should get historical data with a string', function (done) {
    service.historical('2013-12-29').then(function (results) {
      assert(results.disclaimer)
      assert(results.license)
      assert(results.base)
      assert(results.rates)
      done()
    }).catch(function (error) {
      done(error)
    })
  })

  it('should get the list of currencies', function (done) {
    service.currencies().then(function (results) {
      assert(results['USD'])
      done()
    }).catch(function (error) {
      done(error)
    })
  })
})

describe('Cache', function () {
  var service
  var dummyStore

  beforeEach(function () {

    nock.disableNetConnect()

    service = oxr.factory({
      appId: process.env.OXR_APP_ID || '<YOUR_APP_ID>',
      protocol: process.env.OXR_PROTOCOL || 'https'
    })
    dummyStore = {
      value: null,

      get: function () {
        return Promise.resolve(this.value)
      },

      put: function (val) {
        this.value = val
        return Promise.resolve(val)
      }
    }
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('should throw an exception when cache configuration is wrong', function () {
    var c = {
      store: {
        put: function () {}
      }
    }

    try {
      service = cache(c, service)
      assert.fail('should not get here')
    } catch (e) {
      assert.equal(e.message, 'the store must implement both get and put functions')
    }
  })

  it('should throw an exception if method does not exists on the decorated service', function () {
    var c = {
      method: 'historical',
      store: {
        put: function () {},
        get: function () {}
      }
    }

    try {
      service = cache(c, {})
      assert.fail('should not get here')
    } catch (e) {
      assert.equal(e.message, 'the service to decorate must implement historical')
    }
  })

  it('should set defaults correctly', function () {
    service = cache({
      store: {
        put: function () {},
        get: function () {}
      }
    }, service);

    debugger
    assert(service.latest._cache, 'latest should be decorated when no other method name provided');
    assert(service.latest._cache.ttl === 24 * 1000 * 3600, 'latest\'s ttl should default to one day');

    service = cache({
      method: 'historical',
      store: dummyStore
    }, service);

    assert(
      service.historical._cache.ttl === Infinity,
      'methods other than latest should have default to ttl of Infinity'
    );
  })

  it('should decorated the specified method with cache', function () {
     service = cache({
      method: 'currencies',
      ttl: 12345,
      store: dummyStore 
    }, service);
  
    assert(service.currencies._cache.ttl === 12345);
    assert(service.currencies._cache.method === 'currencies');
  })

  it('should cache the value from the remote service', function (done) {
    var timestamp = Date.now() - 1000

    var body = {
      'disclaimer': 'Exchange rates provided by [...]',
      'license': 'Data collected and blended [...]',
      'timestamp': timestamp,
      'base': 'USD',
      'rates': {
        'AED': 3.672626,
        'AFN': 48.3775,
        'ALL': 110.223333,
        'AMD': 409.604993,
        'YER': 215.035559,
        'ZAR': 8.416205,
        'ZMK': 4954.411262,
        'ZWL': 322.355011
      }
    }

    var api = nock(service.protocol + '://openexchangerates.org')
      .get('/api/latest.json?app_id=' + service.appId)
      .reply(200, body)

    service = cache({
      store: dummyStore
    }, service)

    service.latest().then(function (val) {
      assert.equal(val.timestamp, body.timestamp)
      assert.equal(dummyStore.value.timestamp, body.timestamp)
      api.done()
      done()
    }).catch(function (error) {
      done(error)
    })
  })

  it('should get the value from the cache if it has not expired', function (done) {
    var timestamp = Date.now() - 1000

    dummyStore.value = {
      'disclaimer': 'Exchange rates provided by [...]',
      'license': 'Data collected and blended [...]',
      'timestamp': timestamp,
      'base': 'USD',
      'rates': {
        'AED': 3.672626,
        'AFN': 48.3775,
        'ALL': 110.223333,
        'AMD': 409.604993,
        'YER': 215.035559,
        'ZAR': 8.416205,
        'ZMK': 4954.411262,
        'ZWL': 322.355011
      }
    }

    service = cache({
      store: dummyStore
    }, service)

    service.latest().then(function (val) {
      assert.equal(val.timestamp, dummyStore.value.timestamp)
      done()
    }).catch(function (error) {
      done(error)
    })
  })

  it('should refresh the value of the cache if the value has expired', function (done) {
    var timestamp = Date.now() / 1000 - 1000

    var body = {
      'disclaimer': 'Exchange rates provided by [...]',
      'license': 'Data collected and blended [...]',
      'timestamp': timestamp,
      'base': 'USD',
      'rates': {
        'AED': 3.672626,
        'AFN': 48.3775,
        'ALL': 110.223333,
        'AMD': 409.604993,
        'YER': 215.035559,
        'ZAR': 8.416205,
        'ZMK': 4954.411262,
        'ZWL': 322.355011
      }
    }

    dummyStore.value = body

    var api = nock(service.protocol + '://openexchangerates.org')
      .get('/api/latest.json?app_id=' + service.appId)
      .reply(200, body)

    service = cache({
      store: dummyStore,
      ttl: 200
    }, service)

    service.latest().then(function (val) {
      assert.equal(val.timestamp, body.timestamp)
      assert.equal(dummyStore.value.timestamp, body.timestamp)
      api.done()
      done()
    }).catch(function (error) {
      done(error)
    })
  })

  it('should default to cache if an error is returned from the remote', function (done) {
    var timestamp = Date.now() / 1000 - 1000

    var body = {
      'disclaimer': 'Exchange rates provided by [...]',
      'license': 'Data collected and blended [...]',
      'timestamp': timestamp,
      'base': 'USD',
      'rates': {
        'AED': 3.672626,
        'AFN': 48.3775,
        'ALL': 110.223333,
        'AMD': 409.604993,
        'YER': 215.035559,
        'ZAR': 8.416205,
        'ZMK': 4954.411262,
        'ZWL': 322.355011
      }
    }

    dummyStore.value = body

    var api = nock(service.protocol + '://openexchangerates.org')
      .get('/api/latest.json?app_id=' + service.appId)
      .reply(200, {
        error: true,
        description: 'some description',
        status: 400,
        message: 'some error'
      })

    service = cache({
      store: dummyStore,
      ttl: 200
    }, service)

    service.latest().then(function (val) {
      assert.equal(val.timestamp, dummyStore.value.timestamp)
      api.done()
      done()
    }).catch(function (error) {
      done(error)
    })
  })

  it('should rely on Etag value', function (done) {
    // todo
    done()
  })

})
