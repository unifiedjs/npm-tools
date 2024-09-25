/**
 * @import {Context, NpmTeam} from '../util/types.js'
 */

/**
 * @typedef Info
 * @property {Context} context
 * @property {NpmTeam} structure
 */

import assert from 'node:assert/strict'
import chalk from 'chalk'
import pSeries from 'p-series'
import {fetch} from 'undici'
import {find} from '../util/find.js'

// Add humans to a team, warn about humans that shouldn’t be there.

/**
 * @param {Info} info
 * @returns {Promise<undefined>}
 */
export async function members(info) {
  const {context, structure} = info
  const {humans, npmOrg, npmToken} = context
  const {name, member} = structure

  assert(npmOrg)

  const response = await fetch(
    'https://registry.npmjs.org/-/team/' +
      encodeURIComponent(npmOrg) +
      '/' +
      encodeURIComponent(name) +
      '/user',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  const actual = /** @type {Array<string>} */ (await response.json())
  // Cast because `.filter(Boolean)`.
  const expected = /** @type {Array<string>} */ (
    find(context, member)
      .map((github) => {
        return (humans.find((h) => h.github === github) || {}).npm
      })
      // We don’t need to warn for this as it’ll be warned about on the org level.
      .filter(Boolean)
  )

  // Remove.
  let index = -1
  while (++index < actual.length) {
    const login = actual[index]
    if (!expected.includes(login)) {
      console.log(
        '    ' + chalk.red('✖') + ' ~%s should not be in team %s',
        login,
        name
      )
    }
  }

  // Add missing humans.
  await pSeries(
    expected
      .filter((x) => !actual.includes(x))
      .map((user) => () => {
        return fetch(
          'https://registry.npmjs.org/-/team/' +
            encodeURIComponent(npmOrg) +
            '/' +
            encodeURIComponent(name) +
            '/user',
          {
            method: 'PUT',
            body: JSON.stringify({user}),
            headers: {Authorization: 'Bearer ' + npmToken}
          }
        ).then(() => {
          console.log('    ' + chalk.green('✔') + ' add ~%s to %s', user, name)
        })
      })
  )
}
