/**
 * @import {Context, Package, Repo} from '../util/types.js'
 */

/**
 * @typedef BranchRef
 * @property {string | undefined} name
 *
 * @typedef Edge
 * @property {string} cursor
 * @property {Node} node
 *
 * @typedef Node
 * @property {boolean} isArchived
 * @property {string} name
 * @property {BranchRef | undefined} defaultBranchRef
 *
 * @typedef OrganizationResponse
 * @property {Organization} organization
 *
 * @typedef Organization
 * @property {Repositories} repositories
 *
 * @typedef PageInfo
 * @property {boolean} hasNextPage
 *
 * @typedef Repositories
 * @property {Array<Edge>} edges
 * @property {PageInfo} pageInfo
 */

import assert from 'node:assert/strict'
import {promisify} from 'node:util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {repo} from '../repo/index.js'

const run = promisify(repo.run)

/**
 * @param {Context} context
 * @returns {Promise<undefined>}
 */
export async function repos(context) {
  const {org, ghQuery} = context
  /** @type {Array<Repo>} */
  const repositories = []
  /** @type {boolean | undefined} */
  let done
  /** @type {string | undefined} */
  let cursor

  console.log(chalk.bold('repos') + ' for %s', org)

  while (!done) {
    const data = /** @type {OrganizationResponse} */ (
      await ghQuery(
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
    )

    const repos = data.organization.repositories

    repositories.push(
      ...repos.edges.map((edge) => ({
        archived: edge.node.isArchived,
        defaultBranch: edge.node.defaultBranchRef?.name,
        name: edge.node.name
      }))
    )

    const tail = repos.edges.at(-1)
    assert(tail)
    cursor = tail.cursor
    done = !repos.pageInfo.hasNextPage
  }

  /** @type {Array<Array<Package>>} */
  const groups = await pSeries(
    // @ts-expect-error: to do: solve `trough`.
    repositories.map((repo) => () => run({context, repo}))
  )
  const packages = groups.flat().filter((x) => !x.private)

  context.packages = packages
}
