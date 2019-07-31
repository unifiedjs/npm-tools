'use strict'

const {promisify} = require('util')
const pSeries = require('p-series')
const run = promisify(require('../org').run)

module.exports = orgs

async function orgs(ctx) {
  const {orgs} = ctx

  await pSeries(orgs.map(org => () => run({...ctx, org})))
}
