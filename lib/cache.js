var assert = require('assert')
var extend = require('util')._extend
var Promise = require('bluebird')
var concat = Array.prototype.concat.bind([]);

module.exports = function (cacheOptions, service) {
  var options
  var originalFunc
  var store

  var method = cacheOptions.method || 'latest';
  var defaultOptions = {
    method: method,
    ttl: method === 'latest' ? 24 * 1000 * 3600 : Infinity
  }

  options = extend(defaultOptions, cacheOptions)

  assert(options && options.store, 'store must be provided')
  assert(options && options.method, 'method must be provided')
  assert(options.store.put, 'the store must implement both get and put functions')
  assert(options.store.get, 'the store must implement both get and put functions')
  assert(service && service[options.method], 'the service to decorate must implement ' + options.method)

  store  = options.store
  method  = options.method
  originalFunc = service[method]

  service[method] = function () {
    var args = Array.from(arguments)
    var now = Date.now()

    return Promise.resolve(store.get.apply(store, args))
      .then(function (val) {
        if (!val || ((val.timestamp * 1000 + options.ttl) <= now)) {
          return originalFunc.apply(service, args)
            .then(function (rates) {
              return Promise.resolve(store.put.apply(store, concat(rates, args)))
                .finally(function () {
                  return rates
                })
            }).catch(function (err) {
              if (!val) {
                throw err
              }
              // fallback to the cache value even if it has expired
              return val
            })
        } else {
          return val
        }
      })
  }

  service[method]._cache = options

  return service
}
