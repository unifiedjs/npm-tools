import path from 'path'
import {promisify} from 'util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {dependencyGraphAccept} from '../util/constants.js'
import {pkg} from '../pkg/index.js'

const run = promisify(pkg.run)

export async function packages(info) {
  const {repo, ctx} = info
  const {org, ghQuery} = ctx
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

  const manifests = repository.dependencyGraphManifests.nodes

  // Only include `package.json`s, not locks.
  const pkgs = manifests.filter(
    (x) => path.posix.basename(x.filename) === 'package.json'
  )

  let index = -1

  while (++index < pkgs.length) {
    const pkg = pkgs[index]

    if (pkg.exceedsMaxSize) {
      console.log(
        '    ' + chalk.red('✖') + ' manifest %s in %s is too big',
        pkgs[index].filename,
        name
      )
    } else if (!pkg.parseable) {
      console.log(
        '    ' + chalk.red('✖') + ' manifest %s in %s is not parseable',
        pkgs[index].filename,
        name
      )
    }
  }

  console.log('  ' + chalk.bold('packages') + ' for %s', name)

  response = await pSeries(
    pkgs
      .filter((x) => x.parseable && !x.exceedsMaxSize)
      .map((pkg) => () => run({ctx, repo, pkg}))
  )

  return response.map((x) => ({...x, repo: name}))
}
