/**
 * @import {Context} from '../util/types.js'
 */

/**
 * @typedef {'read' | 'write'} Permission
 */

import assert from 'node:assert/strict'
import chalk from 'chalk'
import {fetch} from 'undici'

/**
 * @param {Context} context
 * @returns {Promise<undefined>}
 */
export async function packages(context) {
  const {npmOrg, npmToken, org, packages: expected} = context
  assert(expected, 'expected packages')
  assert(npmOrg, 'expected an npm org')
  /** @type {Record<string, Permission>} */
  let body

  console.error(chalk.bold('packages') + ' for %s', org)

  const response = await fetch(
    'https://registry.npmjs.org/-/org/' +
      encodeURIComponent(npmOrg) +
      '/package',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  if (response.ok) {
    body = /** @type {Record<string, Permission>} */ (await response.json())
  } else {
    body = {}

    console.error(
      '    ' +
        chalk.blue('ℹ') +
        ' could not get packages, does the %s org exist?',
      npmOrg
    )
  }

  const actual = Object.keys(body).map((name) => {
    const permissions = body[name] === 'write' ? 'read-write' : 'read-only'
    return {name, permissions}
  })

  // Remove.
  let index = -1

  while (++index < actual.length) {
    const packageData = actual[index]

    if (!expected.some((y) => packageData.name === y.name)) {
      console.error(
        '  ' + chalk.red('✖') + ' %s should not be in %s with %s',
        packageData.name,
        npmOrg,
        packageData.permissions
      )
    }
  }

  // Adding and permissions are based on teams.
  // See `team/packages` for that.
}
