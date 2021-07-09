const fs = require('fs')
const path = require('path')
const https = require('https')

const base = 'https://raw.githubusercontent.com/unifiedjs/collective/HEAD/data/'

get('humans.yml')
get('teams.yml')

function get(filename) {
  https.get(base + filename, (response) => {
    response.pipe(
      fs.createWriteStream(path.join('config', 'unified-' + filename))
    )
  })
}
