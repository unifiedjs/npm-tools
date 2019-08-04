'use strict'

const chalk = require('chalk')

module.exports = repos

async function repos(ctx) {
  const {org, npmOrg, npmRequest, packages: expected} = ctx
  let body

  console.log(chalk.bold('packages') + ' for %s', org)

  try {
    const res = await npmRequest.get(
      '/-/org/' + encodeURIComponent(npmOrg) + '/package'
    )
    body = res.body
  } catch (error) {
    body = {}

    console.log(
      '    ' +
        chalk.blue('ℹ') +
        ' could not get packages, does the %s org exist?',
      npmOrg,
      error
    )
  }

  const actual = Object.keys(body).map(name => {
    const permissions = body[name] === 'write' ? 'read-write' : 'read-only'
    return {name, permissions}
  })

  // Remove.
  actual
    .filter(x => !expected.find(y => x.name === y.name))
    .forEach(({name, permissions}) => {
      console.log(
        '  ' + chalk.red('✖') + ' %s should not be in %s with %s',
        name,
        npmOrg,
        permissions
      )
    })

  // Adding and permissions are based on teams.
  // See `team/packages` for that.
}
