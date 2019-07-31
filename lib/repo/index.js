'use strict'

const trough = require('trough')
const packages = require('./packages')

module.exports = trough().use(packages)
