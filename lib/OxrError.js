var inherits = require('util').inherits

function OxrError (status, message, description) {
  Error.apply(this, arguments)
  this.status = status
  this.message = message
  this.description = description
}

inherits(OxrError, Error)

module.exports = OxrError
