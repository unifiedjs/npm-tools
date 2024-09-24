import {promisify} from 'node:util'
import fetch from 'node-fetch'
import chalk from 'chalk'
import pSeries from 'p-series'
import {team} from '../team/index.js'

const run = promisify(team.run)

export async function teams(context) {
  const {org, npmOrg, npmToken, npmTeams, npmTokenOwner} = context
  let body

  const response = await fetch(
    'https://registry.npmjs.org/-/org/' + encodeURIComponent(npmOrg) + '/team',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  if (response.ok) {
    body = await response.json()
  } else {
    console.log(
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

  console.log(chalk.bold('teams') + ' for %s', org)

  await pSeries(teams.map((structure) => () => run({context, structure})))
}
