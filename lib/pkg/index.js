'use strict'

const trough = require('trough')
const gh = require('./github')
const deprecated = require('./deprecated')
const collaborators = require('./collaborators')
const transform = require('./transform')

module.exports = trough()
  .use(gh)
  .use(collaborators)
  .use(deprecated)
  .use(transform)
