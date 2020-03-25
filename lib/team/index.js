'use strict'

const trough = require('trough')
const create = require('./create')
const members = require('./members')
const packages = require('./packages')

module.exports = trough().use(create).use(members).use(packages)
