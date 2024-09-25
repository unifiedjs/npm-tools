/**
 * @import {PackageJson} from 'type-fest'
 * @import {Context, PackageManifest, Repo} from '../util/types.js'
 */

/**
 * @typedef Info
 * @property {Context} context
 * @property {PackageJson | undefined} packageData
 * @property {PackageManifest} packageManifest
 * @property {Repo} repo
 *
 * @typedef BlobResponse
 * @property {Repository} repository
 *
 * @typedef BlobObject
 * @property {string | undefined} text
 *
 * @typedef Repository
 * @property {BlobObject} object
 */

import chalk from 'chalk'

/**
 * @param {Info} info
 * @returns {Promise<undefined>}
 */
export async function github(info) {
  const {context, packageManifest, repo} = info
  const {org, ghQuery} = context
  const {name, defaultBranch} = repo
  const {filename} = packageManifest
  const target = [defaultBranch || 'master', filename].join(':')
  /** @type {string | undefined} */
  let buf

  try {
    const response = /** @type {BlobResponse} */ (
      await ghQuery(
        `
        query($org: String!, $name: String!, $target: String!) {
          repository(owner: $org, name: $name) {
            object(expression: $target) {
              ... on Blob {
                text
              }
            }
          }
        }
      `,
        {org, name, target}
      )
    )

    buf = (response.repository.object || {}).text
  } catch (error) {
    console.log(
      '    ' + chalk.blue('ℹ') + ' could not request package at %s',
      target,
      error
    )
  }

  /** @type {PackageJson | undefined} */
  let data

  try {
    data = JSON.parse(buf || '')
  } catch {
    console.log('    ' + chalk.blue('ℹ') + ' package at %s is invalid', target)
  }

  info.packageData = data
}
