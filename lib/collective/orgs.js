/**
 * @import {Context} from '../util/types.js'
 */

import {promisify} from 'node:util'
import pSeries from 'p-series'
import {org} from '../org/index.js'

const run = promisify(org.run)

/**
 * @param {Context} context
 * @returns {Promise<undefined>}
 */
export async function orgs(context) {
  const {npmOrgs} = context

  await pSeries(
    npmOrgs.orgs.map(function (info) {
      /**
       * @returns {Promise<undefined>}
       */
      return function () {
        // @ts-expect-error: `trough` types need to improve.
        return run({
          ...context,
          npmOrg: info.npm,
          orgTeam: info.unified,
          org: info.github
        })
      }
    })
  )
}
