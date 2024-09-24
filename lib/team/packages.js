import chalk from 'chalk'
import fetch from 'node-fetch'
import pSeries from 'p-series'

export async function packages(info) {
  const {structure, context} = info
  const {name, permission} = structure
  const {npmOrg, npmToken, npmTokenOwner, packages: expected} = context

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
        const found = actual.find((y) => x.name === y.name)
        return !found || found.permissions !== permission
      })
      .map((packageData) => () => {
        return fetch(
          'https://registry.npmjs.org/-/team/' +
            encodeURIComponent(npmOrg) +
            '/' +
            encodeURIComponent(name) +
            '/package',
          {
            method: 'PUT',
            body: JSON.stringify({
              package: packageData.name,
              permissions: permission
            }),
            headers: {Authorization: 'Bearer ' + npmToken}
          }
        )
          .then(() => {
            console.log(
              '    ' + chalk.green('✔') + ' add %s to %s with %s',
              packageData.name,
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
              packageData.name,
              name,
              npmTokenOwner
            )
          })
      })
  )
}
