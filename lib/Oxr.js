var request = require('request')
var Promise = require('bluebird')
var extend = require('util')._extend
var OxrError = require('./OxrError.js')
var url = require('url')

var prototype = {
  /**
   * code which actually send the http request and parse the response - for extension purpose
   * @private
   * @param endpoint
   * @param query
   * @param requestOptions
   */
  _send: function send (endpoint, query, requestOptions) {
    var callGet = Promise.promisify(request.get, {multiArgs: true})
    var qs = {app_id: this.appId}
    var options = {qs: qs, json: true}
    var uri = extend({pathname: endpoint}, this)

    query = query || {}
    requestOptions = requestOptions || {}

    extend(qs, query)
    extend(options, requestOptions)

    return callGet(url.format(uri), options)
      .spread(function (result, body) {
        if (body && body.error) {
          throw new OxrError(body.status, body.message, body.description)
        }
        return body
      })
  },

  /**
   * get the latest rates
   * @param {Object} [query] - a query string object (map of parameters value)
   * @param {Object} [requestOptions] - some options to merge/overwrite with the http request (cf npm request for more details)
   * @returns {Promise} - The promise reject with an instance of OxrError if the api return an error
   * {
   * "status" : 400,
   * "message" : "invalid_app_id",
   * "description" : "Invalid App ID - please sign up at https://openexchangerates.org/signup, or contact support"
   * }
   *
   * or will resolve with the rates object
   *
   * {
   * "disclaimer": "Exchange rates provided by [...]",
   * "license": "Data collected and blended [...]",
   * "timestamp": 1319730758,
   * "base": "USD",
   * "rates": {
   *     "AED": 3.672626,
   *     "AFN": 48.3775,
   *     "ALL": 110.223333,
   *     "AMD": 409.604993,
   *     "YER": 215.035559,
   *     "ZAR": 8.416205,
   *     "ZMK": 4954.411262,
   *     "ZWL": 322.355011
   *   }
   * }
   *
   */
  latest: function latest (query, requestOptions) {
    return this._send('api/latest.json', query, requestOptions)
  },

  /**
   * @description get the rates for a given date
   * @see #latest()
   * @param {String | Date} date - a Javascript date object or a String which will resolve in a valid Javascript Date when called with the Date constructor
   * @param {Object} [query] - a query string object (map of parameters value)
   * @param {Object} [requestOptions] - some options to merge/overwrite with the http request (cf npm request for more details)
   * @returns {Promise}
   */
  historical: function historical (date, query, requestOptions) {
    function formatDate (date) {
      var dateObject = new Date(date)
      var year = dateObject.getUTCFullYear().toString()
      var month = (dateObject.getUTCMonth() + 1).toString()
      var day = dateObject.getUTCDate().toString()

      month = month.length === 2 ? month : '0' + month
      day = day.length === 2 ? day : '0' + day

      return [year, month, day].join('-')

    }

    return this._send('api/historical/' + formatDate(date) + '.json', query, requestOptions)
  },

  /**
   * get the list of currencies
   */
  currencies: function currencies (query, requestOptions) {
    return this._send('api/currencies.json', query, requestOptions)
  }
}

module.exports = prototype
