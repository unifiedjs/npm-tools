import chalk from 'chalk'
import fetch from 'node-fetch'

export async function user(context) {
  const {npmToken} = context

  const response = await fetch('https://registry.npmjs.org/-/npm/v1/user', {
    headers: {Authorization: 'Bearer ' + npmToken}
  })

  const {name} = await response.json()

  context.npmTokenOwner = name

  console.log(chalk.blue('ℹ') + ' authenticated as %s', name)
}
