import chalk from 'chalk'
import fetch from 'node-fetch'

export async function packages(context) {
  const {org, npmOrg, npmToken, packages: expected} = context
  let body

  console.log(chalk.bold('packages') + ' for %s', org)

  const response = await fetch(
    'https://registry.npmjs.org/-/org/' +
      encodeURIComponent(npmOrg) +
      '/package',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  if (response.ok) {
    body = await response.json()
  } else {
    body = {}

    console.log(
      '    ' +
        chalk.blue('ℹ') +
        ' could not get packages, does the %s org exist?',
      npmOrg
    )
  }

  const actual = Object.keys(body).map((name) => {
    const permissions = body[name] === 'write' ? 'read-write' : 'read-only'
    return {name, permissions}
  })

  // Remove.
  let index = -1
  while (++index < actual.length) {
    const packageData = actual[index]

    if (!expected.some((y) => packageData.name === y.name)) {
      console.log(
        '  ' + chalk.red('✖') + ' %s should not be in %s with %s',
        packageData.name,
        npmOrg,
        packageData.permissions
      )
    }
  }

  // Adding and permissions are based on teams.
  // See `team/packages` for that.
}
