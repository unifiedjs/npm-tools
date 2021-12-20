import {promisify} from 'node:util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {repo} from '../repo/index.js'

const run = promisify(repo.run)

export async function repos(ctx) {
  const {org, ghQuery} = ctx
  let repositories = []
  let done
  let cursor

  console.log(chalk.bold('repos') + ' for %s', org)

  while (!done) {
    const data = await ghQuery(
      `
        query($org: String!, $cursor: String) {
          organization(login: $org) {
            repositories(first: 100, after: $cursor) {
              edges {
                cursor
                node {
                  isArchived
                  name
                  defaultBranchRef { name }
                }
              }
              pageInfo { hasNextPage }
            }
          }
        }
      `,
      {org, cursor}
    )

    const repos = data.organization.repositories

    repositories = repositories.concat(
      repos.edges.map((edge) => ({
        name: edge.node.name,
        archived: edge.node.isArchived,
        defaultBranch: (edge.node.defaultBranchRef || {}).name
      }))
    )

    cursor = repos.edges[repos.edges.length - 1].cursor
    done = !repos.pageInfo.hasNextPage
  }

  const groups = await pSeries(
    repositories.map((repo) => () => run({ctx, repo}))
  )
  const packages = [].concat([], ...groups).filter((x) => !x.private)

  return {...ctx, packages}
}
