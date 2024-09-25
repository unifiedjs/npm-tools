/**
 * @import {Context} from '../util/types.js'
 */

import assert from 'node:assert/strict'
import {promisify} from 'node:util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {fetch} from 'undici'
import {team} from '../team/index.js'

const run = promisify(team.run)

/**
 * @param {Context} context
 * @returns {Promise<undefined>}
 */
export async function teams(context) {
  const {org, npmOrg, npmToken, npmTeams, npmTokenOwner} = context
  /** @type {Array<string> | undefined} */
  let body

  assert(npmOrg)
  assert(npmTeams)

  const response = await fetch(
    'https://registry.npmjs.org/-/org/' + encodeURIComponent(npmOrg) + '/team',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  if (response.ok) {
    body = /** @type {Array<string>} */ (await response.json())
  } else {
    console.error(
      chalk.red('✖') +
        ' could not get teams for %s, make sure the current token’s user (%s) is an owner',
      npmOrg,
      npmTokenOwner
    )

    return
  }

  const actual = new Set(body.map((x) => x.slice(x.indexOf(':') + 1)))

  const teams = npmTeams.map((x) => ({
    ...x,
    exists: actual.has(x.name)
  }))

  console.error(chalk.bold('teams') + ' for %s', org)

  // @ts-expect-error: to do: solve `trough`.
  await pSeries(teams.map((structure) => () => run({context, structure})))
}
