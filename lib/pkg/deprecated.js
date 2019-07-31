'use strict'

const chalk = require('chalk')

module.exports = request

async function request(info) {
  const {ctx, repo, pkgData} = info
  const {npmRequest} = ctx
  const {name} = pkgData || {}
  const {archived} = repo

  if (!pkgData || !name || pkgData.private || archived) {
    return
  }

  const {body} = await npmRequest.get('/' + encodeURIComponent(name))
  const version = body.versions[body['dist-tags'].latest]
  const deprecated = 'deprecated' in version

  // Note: archived repos don’t return package manifests, so we can’t check
  // if packages from archived repos are deprecated.

  if (deprecated) {
    console.log(
      '    ' +
        chalk.blue('ℹ') +
        ' expected undeprecated %s as %s isn’t archived',
      name,
      repo.name
    )
  }
}
