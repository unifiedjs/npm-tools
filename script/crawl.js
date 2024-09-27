import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'

const base = 'https://raw.githubusercontent.com/unifiedjs/collective/HEAD/data/'

get('humans.yml')
get('teams.yml')

/**
 * @param {string} filename
 *   Name.
 * @returns {undefined}
 *   Nothing.
 */
function get(filename) {
  https.get(base + filename, function (response) {
    response.pipe(
      fs.createWriteStream(path.join('config', 'unified-' + filename))
    )
  })
}
