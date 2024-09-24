import {promisify} from 'node:util'
import pSeries from 'p-series'
import {org} from '../org/index.js'

const run = promisify(org.run)

export async function orgs(context) {
  const {npmOrgs} = context

  await pSeries(
    npmOrgs.orgs.map(
      (info) => () =>
        run({
          ...context,
          org: info.github,
          npmOrg: info.npm,
          orgTeam: info.unified
        })
    )
  )
}
