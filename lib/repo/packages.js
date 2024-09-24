import path from 'node:path'
import {promisify} from 'node:util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {dependencyGraphAccept} from '../util/constants.js'
import {packagePipeline} from '../pkg/index.js'

const run = promisify(packagePipeline.run)

export async function packages(info) {
  const {repo, context} = info
  const {org, ghQuery} = context
  const {name, archived, defaultBranch} = repo

  if (!defaultBranch) {
    console.log('  ' + chalk.blue('ℹ') + ' repo %s has no branches yet', name)
    return []
  }

  if (archived) {
    console.log('  ' + chalk.blue('ℹ') + ' repo %s is archived', name)
  }

  let response

  try {
    response = await ghQuery(
      `
        query($org: String!, $name: String!) {
          repository(owner: $org, name: $name) {
            dependencyGraphManifests {
              nodes {
                filename
                exceedsMaxSize
                parseable
                blobPath
              }
            }
          }
        }
      `,
      {org, name, headers: {Accept: dependencyGraphAccept}}
    )
  } catch (_) {
    console.log(
      '    ' +
        chalk.red('✖') +
        ' could not get manifests for %s: maybe they are loading? (in which case, running this again will probably work)',
      name
    )
    return []
  }

  const {repository} = response

  const manifestNodes = repository.dependencyGraphManifests.nodes

  // Only include `package.json`s, not locks.
  const manifests = manifestNodes.filter(
    (x) => path.posix.basename(x.filename) === 'package.json'
  )

  let index = -1

  while (++index < manifests.length) {
    const manifest = manifests[index]

    if (manifest.exceedsMaxSize) {
      console.log(
        '    ' + chalk.red('✖') + ' manifest %s in %s is too big',
        manifest.filename,
        name
      )
    } else if (!manifest.parseable) {
      console.log(
        '    ' + chalk.red('✖') + ' manifest %s in %s is not parseable',
        manifest.filename,
        name
      )
    }
  }

  console.log('  ' + chalk.bold('packages') + ' for %s', name)

  response = await pSeries(
    manifests
      .filter((x) => x.parseable && !x.exceedsMaxSize)
      .map((packageManifest) => () => run({context, repo, packageManifest}))
  )

  return response.map((x) => ({...x, repo: name}))
}
