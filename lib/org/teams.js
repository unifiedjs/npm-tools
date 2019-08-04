'use strict'

const {promisify} = require('util')
const chalk = require('chalk')
const pSeries = require('p-series')
const run = promisify(require('../team').run)

module.exports = teams

async function teams(ctx) {
  const {org, npmOrg, npmRequest, npmTeams, npmTokenOwner} = ctx
  let response

  try {
    response = await npmRequest.get(
      '/-/org/' + encodeURIComponent(npmOrg) + '/team'
    )
  } catch (error) {
    if (!error || error.statusCode !== 403) {
      throw error
    }

    console.log(
      chalk.red('✖') +
        ' could not get teams for %s, make sure the current token’s user (%s) is an owner',
      npmOrg,
      npmTokenOwner
    )

    return
  }

  const {body} = response
  const actual = body.map(x => x.slice(x.indexOf(':') + 1))

  const teams = npmTeams.map(x => ({
    ...x,
    exists: actual.includes(x.name)
  }))

  console.log(chalk.bold('teams') + ' for %s', org)

  await pSeries(teams.map(structure => () => run({ctx, structure})))
}
