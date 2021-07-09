import {promisify} from 'util'
import pSeries from 'p-series'
import {org} from '../org/index.js'

const run = promisify(org.run)

export async function orgs(ctx) {
  const {npmOrgs} = ctx

  await pSeries(
    npmOrgs.orgs.map(
      (info) => () =>
        run({...ctx, org: info.github, npmOrg: info.npm, orgTeam: info.unified})
    )
  )
}
