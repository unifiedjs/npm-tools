'use strict'

const chalk = require('chalk')
const fetch = require('node-fetch')
const pSeries = require('p-series')

module.exports = packages

async function packages(info) {
  const {structure, ctx} = info
  const {name, permission} = structure
  const {npmOrg, npmToken, npmTokenOwner, packages: expected} = ctx

  const response = await fetch(
    'https://registry.npmjs.org/-/team/' +
      encodeURIComponent(npmOrg) +
      '/' +
      encodeURIComponent(name) +
      '/package',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  const body = await response.json()

  const actual = Object.keys(body).map((name) => {
    const permissions = body[name] === 'write' ? 'read-write' : 'read-only'
    return {name, permissions}
  })

  // Remove logging is done by `org/packages`: we don’t need to duplicate
  // messages.

  // Add missing packages and fix permissions.
  await pSeries(
    expected
      .filter((x) => {
        const npmPkg = actual.find((y) => x.name === y.name)
        return !npmPkg || npmPkg.permissions !== permission
      })
      .map((pkg) => () => {
        return fetch(
          'https://registry.npmjs.org/-/team/' +
            encodeURIComponent(npmOrg) +
            '/' +
            encodeURIComponent(name) +
            '/package',
          {
            method: 'PUT',
            body: JSON.stringify({package: pkg.name, permissions: permission}),
            headers: {Authorization: 'Bearer ' + npmToken}
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
          .catch((error) => {
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
