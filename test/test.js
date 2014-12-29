var conf = require('../conf.js');
var oxr = require('../index.js');
var assert = require('assert');

describe('Open exchange rate promise service', function () {

  var service;

  beforeEach(function () {
    service = oxr.factory(conf);
  });

  it('should get the latest rates', function (done) {

    service.latest()
      .then(function (results) {
        assert(results.disclaimer);
        assert(results.license);
        assert(results.base);
        assert(results.rates);
        assert(results.timestamp);
        done();
      });
  });

  it('parse API error response', function (done) {
    service.latest({app_id: 'alsdkfjs'})
      .then(function () {
        throw new Error('should not get here');
      }, function (err) {
        assert(err instanceof oxr.OxrError);
        assert.equal(err.status, 401);
        assert.equal(err.message, 'invalid_app_id');
        assert.equal(err.description, 'Invalid App ID provided - please sign up at https://openexchangerates.org/signup, or contact support@openexchangerates.org. Thanks!');
        done();
      });
  });

  it('should get historical data with a date object', function (done) {
    service.historical(new Date(Date.now() - 24 * 3600 * 7))
      .then(function (results) {
        assert(results.disclaimer);
        assert(results.license);
        assert(results.base);
        assert(results.rates);
        done();
      });
  });


  it('should get historical data with a string', function (done) {
    service.historical('2013-12-29')
      .then(function (results) {
        assert(results.disclaimer);
        assert(results.license);
        assert(results.base);
        assert(results.rates);
        done();
      });
  });

  it('should get the list of currencies', function (done) {
    service.currencies()
      .then(function (results) {
        assert(results['USD']);
        done();
      });
  });


});