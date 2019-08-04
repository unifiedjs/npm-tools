'use strict'

const chalk = require('chalk')
const interpolate = require('../util/interpolate')

module.exports = create

// Create a team if it doesn’t already exist.
// Note: there’s no way to get the description on the npm API, so we can’t
// update that if it’s incorrect.
async function create(info) {
  const {structure, ctx} = info
  const {exists, name} = structure
  const {npmOrg, npmRequest} = ctx

  console.log('  ' + chalk.bold('team') + ' %s', name)

  if (exists) {
    console.log('    ' + chalk.blue('ℹ') + ' team %s already exists', name)
  } else {
    const description = interpolate(ctx, structure.description)

    await npmRequest.put('/-/org/' + encodeURIComponent(npmOrg) + '/team', {
      body: {name, description}
    })

    structure.exists = true
    console.log('    ' + chalk.green('✓') + ' team %s created', name)
  }
}
