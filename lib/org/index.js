const trough = require('trough')
const repos = require('./repos')
const packages = require('./packages')
const teams = require('./teams')
const members = require('./members')

module.exports = trough().use(repos).use(packages).use(members).use(teams)
