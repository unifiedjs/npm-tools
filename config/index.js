'use strict'

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

exports.humans = load('unified-humans')
exports.teams = load('unified-teams')
exports.npmOrgs = load('npm-organizations')
exports.npmTeams = load('npm-teams')

function load(name) {
  return yaml.safeLoad(fs.readFileSync(path.join('config', name + '.yml')))
}
