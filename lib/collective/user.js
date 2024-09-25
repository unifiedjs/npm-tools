/**
 * @import {Context} from '../util/types.js'
 */

/**
 * @typedef NpmUserResponse
 * @property {unknown} cidr_whitelist
 * @property {string} created
 * @property {boolean} email_verified
 * @property {string} email
 * @property {string} freenode
 * @property {string} fullname
 * @property {string} github
 * @property {string} homepage
 * @property {string} name
 * @property {unknown} tfa
 * @property {string} twitter
 * @property {string} updated
 */

import chalk from 'chalk'
import {fetch} from 'undici'

/**
 * @param {Context} context
 * @returns {Promise<undefined>}
 */
export async function user(context) {
  const {npmToken} = context

  const response = await fetch('https://registry.npmjs.org/-/npm/v1/user', {
    headers: {Authorization: 'Bearer ' + npmToken}
  })

  const data = /** @type {NpmUserResponse} */ (await response.json())

  context.npmTokenOwner = data.name

  console.error(chalk.blue('ℹ') + ' authenticated as %s', data.name)
}
