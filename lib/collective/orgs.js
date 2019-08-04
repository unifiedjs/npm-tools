'use strict'

const {promisify} = require('util')
const pSeries = require('p-series')
const run = promisify(require('../org').run)

module.exports = orgs

async function orgs(ctx) {
  const {npmOrgs} = ctx

  await pSeries(
    npmOrgs.orgs.map(info => () =>
      run({...ctx, org: info.github, npmOrg: info.npm, orgTeam: info.unified})
    )
  )
}
