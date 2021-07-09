'use strict'

const trough = require('trough')
const configure = require('./configure.js')
const orgs = require('./orgs.js')
const user = require('./user.js')

module.exports = trough().use(configure).use(user).use(orgs)
