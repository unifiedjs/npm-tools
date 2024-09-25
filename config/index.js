import fs from 'node:fs'
// Note: to do: switch.
import yaml from 'js-yaml'

// Name of the whole collective.
export const collective = 'unifiedjs'

export const humans = load('unified-humans')
export const npmOrgs = load('npm-organizations')
export const npmTeams = load('npm-teams')
export const teams = load('unified-teams')

/**
 *
 * @param {string} name
 * @returns {unknown}
 */
function load(name) {
  const url = new URL(name + '.yml', import.meta.url)
  const document = fs.readFileSync(url, 'utf8')
  return yaml.load(document)
}
