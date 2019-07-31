'use strict'

const chalk = require('chalk')
const tools = require('./lib')
const config = require('./config')

tools.run(
  {
    // Note: npmToken must be granted by an owner of all orgs.
    npmToken: process.env.NPM_TOKEN,
    // Note: ghToken needs `admin:org` and `repo` scopes.
    ghToken: process.env.GITHUB_TOKEN,
    ...config
  },
  done
)

function done(err) {
  if (err) {
    console.log(chalk.red('✖') + ' error')
    console.error(err)
  } else {
    console.log(chalk.green('✓') + ' done')
  }
}
