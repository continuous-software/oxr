var Oxr = require('./lib/Oxr.js')
var extend = require('util')._extend

module.exports = {
  Oxr: Oxr,
  OxrError: require('./lib/OxrError.js'),
  factory: function factory (options) {
    options = options || {}

    var defaults = {
      protocol: 'https',
      hostname: 'openexchangerates.org'
    }

    options = extend(defaults, options)

    var service = Object.create(Oxr)

    extend(service, options)

    return service
  },
  cache: require('./lib/cache.js')
}
