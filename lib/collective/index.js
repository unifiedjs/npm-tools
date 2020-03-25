'use strict'

const trough = require('trough')
const configure = require('./configure')
const orgs = require('./orgs')
const user = require('./user')

module.exports = trough().use(configure).use(user).use(orgs)
