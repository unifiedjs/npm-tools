import chalk from 'chalk'
import fetch from 'node-fetch'
import {interpolate} from '../util/interpolate.js'

// Create a team if it doesn’t already exist.
// Note: there’s no way to get the description on the npm API, so we can’t
// update that if it’s incorrect.
export async function create(info) {
  const {structure, ctx} = info
  const {exists, name} = structure
  const {npmOrg, npmToken} = ctx

  console.log('  ' + chalk.bold('team') + ' %s', name)

  if (exists) {
    console.log('    ' + chalk.blue('ℹ') + ' team %s already exists', name)
    return
  }

  const description = interpolate(ctx, structure.description)

  await fetch(
    'https://registry.npmjs.org/-/org/' + encodeURIComponent(npmOrg) + '/team',
    {
      method: 'PUT',
      body: JSON.stringify({name, description}),
      headers: {Authorization: 'Bearer ' + npmToken}
    }
  )

  structure.exists = true
  console.log('    ' + chalk.green('✓') + ' team %s created', name)
}
