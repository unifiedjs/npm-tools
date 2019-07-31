'use strict'

const chalk = require('chalk')

module.exports = user

async function user(ctx) {
  const {npmRequest} = ctx
  const {body} = await npmRequest.get('/-/npm/v1/user')
  const {name} = body

  ctx.npmTokenOwner = name

  console.log(chalk.blue('ℹ') + ' authenticated as %s', name)
}
