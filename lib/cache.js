var assert = require('assert');
var extend = require('util')._extend;

module.exports = function cache(cacheOptions, service) {

  var options;
  var defaultOptions = {
    ttl: 24 * 1000 * 3600
  };
  var originalFunc;
  var store;

  assert(cacheOptions && cacheOptions.store, 'store must be provided');
  assert(cacheOptions.store.put, 'the store must implement both get and put functions');
  assert(cacheOptions.store.get, 'the store must implement both get and put functions');
  assert(service && service.latest, 'the service to decorate must implement latest');

  options = extend(defaultOptions, cacheOptions);

  store = options.store;

  originalFunc = service.latest;

  service.latest = function latest() {

    var now = Date.now();

    return store.get()
      .then(function (val) {
        if (!val || ((val.timestamp + options.ttl) <= now)) {
          return originalFunc.call(service)
            .then(function (rates) {
              return store.put(rates)
                .finally(function () {
                  return rates;
                });
            }).catch(function (err) {
              if (!val) {
                throw err;
              }
              //fallback to the cache value even if it has expired
              return val;
            });
        } else {
          return val;
        }
      });
  };

  return service;
};
