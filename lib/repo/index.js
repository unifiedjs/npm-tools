'use strict'

const trough = require('trough')
const packages = require('./packages.js')

module.exports = trough().use(packages)
