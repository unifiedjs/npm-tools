'use strict'

const trough = require('trough')
const gh = require('./github.js')
const deprecated = require('./deprecated.js')
const collaborators = require('./collaborators.js')
const transform = require('./transform.js')

module.exports = trough()
  .use(gh)
  .use(collaborators)
  .use(deprecated)
  .use(transform)
