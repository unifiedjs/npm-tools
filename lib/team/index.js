'use strict'

const trough = require('trough')
const create = require('./create.js')
const members = require('./members.js')
const packages = require('./packages.js')

module.exports = trough().use(create).use(members).use(packages)
