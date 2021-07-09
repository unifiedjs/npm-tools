import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export const humans = load('unified-humans')
export const teams = load('unified-teams')
export const npmOrgs = load('npm-organizations')
export const npmTeams = load('npm-teams')

function load(name) {
  return yaml.load(fs.readFileSync(path.join('config', name + '.yml')))
}
