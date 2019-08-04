'use strict'

const chalk = require('chalk')
const pSeries = require('p-series')

module.exports = packages

async function packages(info) {
  const {structure, ctx} = info
  const {name, permission} = structure
  const {npmOrg, npmRequest, npmTokenOwner, packages: expected} = ctx

  const res = await npmRequest.get(
    '/-/team/' +
      encodeURIComponent(npmOrg) +
      '/' +
      encodeURIComponent(name) +
      '/package'
  )

  const actual = Object.keys(res.body).map(name => {
    const permissions = res.body[name] === 'write' ? 'read-write' : 'read-only'
    return {name, permissions}
  })

  // Remove logging is done by `org/packages`: we don’t need to duplicate
  // messages.

  // Add missing packages and fix permissions.
  await pSeries(
    expected
      .filter(x => {
        const npmPkg = actual.find(y => x.name === y.name)
        return !npmPkg || npmPkg.permissions !== permission
      })
      .map(pkg => () => {
        return npmRequest
          .put(
            '/-/team/' +
              encodeURIComponent(npmOrg) +
              '/' +
              encodeURIComponent(name) +
              '/package',
            {
              body: {package: pkg.name, permissions: permission}
            }
          )
          .then(() => {
            console.log(
              '    ' + chalk.green('✔') + ' add %s to %s with %s',
              pkg.name,
              name,
              permission
            )
          })
          .catch(error => {
            if (!error || error.statusCode !== 403) {
              throw error
            }

            console.log(
              '    ' +
                chalk.red('✖') +
                ' could not add %s to %s, make sure the current token’s user (%s) is an owner',
              pkg.name,
              name,
              npmTokenOwner
            )
          })
      })
  )
}
