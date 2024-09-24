import chalk from 'chalk'
import fetch from 'node-fetch'

export async function deprecated(info) {
  const {context, repo, packageData} = info
  const {npmToken} = context
  const {name} = packageData || {}
  const {archived} = repo

  if (!packageData || !name || packageData.private || archived) {
    return
  }

  const response = await fetch(
    'https://registry.npmjs.org/' + encodeURIComponent(name),
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  const body = await response.json()

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
