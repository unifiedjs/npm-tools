'use strict'

const chalk = require('chalk')
const tools = require('./lib/index.js')
const config = require('./config/index.js')

tools.run(
  {
    // Note: npmToken must be granted by an owner of all orgs.
    npmToken: process.env.NPM_TOKEN,
    // Note: ghToken needs `admin:org` and `repo` scopes.
    ghToken: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
    ...config
  },
  done
)

function done(error) {
  if (error) {
    console.log(chalk.red('✖') + ' error')
    console.error(error)
  } else {
    console.log(chalk.green('✓') + ' done')
  }
}
