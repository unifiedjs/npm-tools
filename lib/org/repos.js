'use strict'

const {promisify} = require('util')
const chalk = require('chalk')
const pSeries = require('p-series')
const run = promisify(require('../repo').run)

module.exports = repos

async function repos(ctx) {
  const {org, ghQuery} = ctx

  console.log(chalk.bold('repos') + ' for %s', org)

  // To do: paginate.
  const {organization} = await ghQuery(
    `
      query($org: String!) {
        organization(login: $org) {
          repositories(first: 100) {
            nodes {
              isArchived
              name
              defaultBranchRef {
                name
              }
            }
          }
        }
      }
    `,
    {org}
  )

  const repositories = organization.repositories.nodes.map(x => ({
    name: x.name,
    archived: x.isArchived,
    defaultBranch: (x.defaultBranchRef || {}).name
  }))

  const groups = await pSeries(repositories.map(repo => () => run({ctx, repo})))
  const packages = [].concat([], ...groups).filter(x => !x.private)

  return {...ctx, packages}
}
