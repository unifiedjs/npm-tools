'use strict'

const chalk = require('chalk')
const fetch = require('node-fetch')

module.exports = user

async function user(ctx) {
  const {npmToken} = ctx

  const response = await fetch('https://registry.npmjs.org/-/npm/v1/user', {
    headers: {Authorization: 'Bearer ' + npmToken}
  })

  const {name} = await response.json()

  ctx.npmTokenOwner = name

  console.log(chalk.blue('ℹ') + ' authenticated as %s', name)
  // throw 1
}
