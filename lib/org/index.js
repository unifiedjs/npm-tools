const trough = require('trough')
const repos = require('./repos.js')
const packages = require('./packages.js')
const teams = require('./teams.js')
const members = require('./members.js')

module.exports = trough().use(repos).use(packages).use(members).use(teams)
