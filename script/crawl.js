const fs = require('fs')
const path = require('path')
const https = require('https')

const base =
  'https://raw.githubusercontent.com/unifiedjs/governance/master/data/'
const files = ['humans.yml', 'teams.yml']

files.forEach(filename => {
  https.get(base + filename, res => {
    res.pipe(fs.createWriteStream(path.join('config', 'unified-' + filename)))
  })
})