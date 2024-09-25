import process from 'node:process'
import chalk from 'chalk'
import {npmTools} from './lib/index.js'
import * as config from './config/index.js'

npmTools.run(
  {
    // Note: ghToken needs `admin:org` and `repo` scopes.
    ghToken: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
    // Note: npmToken must be granted by an owner of all orgs.
    npmToken: process.env.NPM_TOKEN,
    ...config
  },
  done
)

/**
 * @param {unknown} error
 * @returns {undefined}
 */
function done(error) {
  if (error) {
    console.log(chalk.red('✖') + ' error')
    console.error(error)
  } else {
    console.log(chalk.green('✓') + ' done')
  }
}
