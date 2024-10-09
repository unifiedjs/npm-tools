/**
 * @import {GraphqlResponseError, graphql as GraphQl} from '@octokit/graphql'
 * @import {Packument} from 'pacote'
 * @import {PackageJson} from 'type-fest'
 * @import {Context, Human, NpmOrgs, NpmOrg, NpmPermissionLong, NpmPermissionShort, NpmRole, NpmTeam, PackageManifest, Package, Repo, Team} from './util/types.js'
 */

/**
 * @typedef BranchRefData
 * @property {string | undefined} name
 *
 * @typedef DependencyGraphManifestsData
 * @property {Array<PackageManifest>} nodes
 *
 * @typedef EdgeData
 * @property {string} cursor
 * @property {NodeData} node
 *
 * @typedef NodeData
 * @property {boolean} isArchived
 * @property {string} name
 * @property {BranchRefData | undefined} defaultBranchRef
 *
 * @typedef NpmUserData
 * @property {unknown} cidr_whitelist
 * @property {string} created
 * @property {boolean} email_verified
 * @property {string} email
 * @property {string} freenode
 * @property {string} fullname
 * @property {string} github
 * @property {string} homepage
 * @property {string} name
 * @property {unknown} tfa
 * @property {string} twitter
 * @property {string} updated
 *
 * @typedef ObjectObject
 * @property {string} text
 *
 * @typedef ObjectRepository
 * @property {ObjectObject | undefined} object
 *
 * @typedef ObjectResponse
 * @property {ObjectRepository} repository
 *
 * @typedef OrganizationResponse
 * @property {OrganizationData} organization
 *
 * @typedef OrganizationData
 * @property {RepositoriesData} repositories
 *
 * @typedef PageInfoData
 * @property {boolean} hasNextPage
 *
 * @typedef RepositoriesData
 * @property {Array<EdgeData>} edges
 * @property {PageInfoData} pageInfo
 *
 * @typedef RepositoryData
 * @property {DependencyGraphManifestsData} dependencyGraphManifests
 *
 * @typedef RepositoryResponse
 * @property {RepositoryData} repository
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {graphql} from '@octokit/graphql'
import chalk from 'chalk'
import pSeries from 'p-series'
import {fetch} from 'undici'
import yaml from 'yaml'
import {dependencyGraphAccept} from './util/constants.js'
import {find} from './util/find.js'
import {interpolate} from './util/interpolate.js'

/**
 * @param {string} name
 * @returns {Promise<unknown>}
 */
async function loadYaml(name) {
  const url = new URL('../config/' + name + '.yml', import.meta.url)
  const document = await fs.readFile(url, 'utf8')
  return yaml.parse(document)
}

/**
 * @returns {Promise<undefined>}
 */
export async function npmTools() {
  // Note: ghToken needs `admin:org` and `repo` scopes.
  const ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  // Note: npmToken must be granted by an owner of all orgs.
  const npmToken = process.env.NPM_TOKEN
  assert(ghToken, 'expected `ghToken` to be set')
  assert(npmToken, 'expected `npmToken` to be set')

  const npmUserResponse = await fetch(
    'https://registry.npmjs.org/-/npm/v1/user',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  const npmUserData = /** @type {NpmUserData} */ (await npmUserResponse.json())
  const npmTokenOwner = npmUserData.name

  console.error(chalk.blue('ℹ') + ' authenticated as %s', npmTokenOwner)

  /** @type {Context} */
  const context = {
    // Name of the whole collective.
    collective: 'unifiedjs',
    humans: /** @type {Array<Human>} */ (await loadYaml('unified-humans')),
    ghToken,
    npmOrgs: /** @type {NpmOrgs} */ (await loadYaml('npm-organizations')),
    npmTeams: /** @type {Array<NpmTeam>} */ (await loadYaml('npm-teams')),
    ghQuery: wrap(
      graphql.defaults({headers: {authorization: 'token ' + ghToken}})
    ),
    npmTokenOwner,
    npmToken,
    teams: /** @type {Array<Team>} */ (await loadYaml('unified-teams'))
  }

  /** @type {Array<() => Promise<undefined>>} */
  const organizationTasks = []

  for (const npmOrg of context.npmOrgs.orgs) {
    organizationTasks.push(async function () {
      await organizationRun(context, npmOrg)
    })
  }

  await pSeries(organizationTasks)

  console.warn(chalk.green('✓') + ' done')
}

/**
 * @param {Context} context
 * @param {NpmOrg} npmOrg
 * @returns {Promise<undefined>}
 */
async function organizationRun(context, npmOrg) {
  // Repos.

  /** @type {Array<Repo>} */
  const repositories = []
  let done = false
  /** @type {string | undefined} */
  let cursor

  console.warn(chalk.bold('repos') + ' for %s', npmOrg.github)

  while (!done) {
    const data = /** @type {OrganizationResponse} */ (
      // eslint-disable-next-line no-await-in-loop
      await context.ghQuery(
        `
        query($cursor: String, $org: String!) {
          organization(login: $org) {
            repositories(first: 100, after: $cursor) {
              edges {
                cursor
                node {
                  defaultBranchRef { name }
                  isArchived
                  name
                }
              }
              pageInfo { hasNextPage }
            }
          }
        }
      `,
        {cursor, org: npmOrg.github}
      )
    )

    const repos = data.organization.repositories

    for (const edge of repos.edges) {
      repositories.push({
        archived: edge.node.isArchived,
        defaultBranch: edge.node.defaultBranchRef?.name,
        name: edge.node.name
      })

      cursor = edge.cursor
    }

    done = !repos.pageInfo.hasNextPage
  }

  /** @type {Array<() => Promise<undefined>>} */
  const repoTasks = []
  /** @type {Array<Package>} */
  const packages = []

  for (const repo of repositories) {
    repoTasks.push(async function () {
      const results = await repoRun(context, repo, npmOrg)
      packages.push(...results)
    })
  }

  await pSeries(repoTasks)

  const [orgPackageResponse, orgTeamResponse, orgUserResponse] =
    await Promise.all([
      fetch(
        'https://registry.npmjs.org/-/org/' +
          encodeURIComponent(npmOrg.npm) +
          '/package',
        {headers: {Authorization: 'Bearer ' + context.npmToken}}
      ),
      fetch(
        'https://registry.npmjs.org/-/org/' +
          encodeURIComponent(npmOrg.npm) +
          '/team',
        {headers: {Authorization: 'Bearer ' + context.npmToken}}
      ),
      fetch(
        'https://registry.npmjs.org/-/org/' +
          encodeURIComponent(npmOrg.npm) +
          '/user',
        {headers: {Authorization: 'Bearer ' + context.npmToken}}
      )
    ])

  if (!orgPackageResponse.ok || !orgUserResponse.ok) {
    console.warn(
      '    ' +
        chalk.blue('ℹ') +
        ' could not get packages or members, does the `%s` org exist?',
      npmOrg.npm
    )
    return
  }

  if (!orgTeamResponse.ok) {
    console.warn(
      chalk.red('✖') +
        ' could not get teams for `%s`, make sure the current token’s user (`%s`) is an owner',
      npmOrg.npm,
      context.npmTokenOwner
    )
    return
  }

  /** @type {Array<() => Promise<undefined>>} */
  const tasks = []

  const orgPackage = /** @type {Record<string, NpmPermissionShort>} */ (
    await orgPackageResponse.json()
  )
  const orgTeam = /** @type {Array<string>} */ (await orgTeamResponse.json())
  const orgUser = /** @type {Record<string, NpmRole>} */ (
    await orgUserResponse.json()
  )

  // Packages.

  // Adding and permissions are based on teams.
  // See `team/index` for that.
  // But we can look for packages that need to be removed.
  for (const name of Object.keys(orgPackage)) {
    const info = packages.find(function (y) {
      return name === y.name
    })

    if (!info) {
      tasks.push(async function () {
        const packageArchived = await deprecated(context, name)

        if (!packageArchived) {
          console.error(
            '  ' +
              chalk.red('✖') +
              ' npm package `%s` should not be in org `%s` (or it should be deprecated)',
            name,
            npmOrg.npm
          )
        }
      })
    }
  }

  // Members.
  const data = {npmOrg: npmOrg.npm, orgTeam: npmOrg.unified, org: npmOrg.github}
  const admins = find(context, interpolate(data, context.npmOrgs.admin))
  const members = find(context, interpolate(data, context.npmOrgs.member))
  const owners = find(context, interpolate(data, context.npmOrgs.owner))
  const people = [...new Set([...admins, ...members, ...owners])]

  /** @type {Array<string>} */
  const expectedMembers = []

  for (const github of people) {
    const human = context.humans.find(function (h) {
      return h.github === github
    })
    assert(human, 'could not find human for `@' + github + '`')

    if (!human.npm) {
      console.warn(
        '  ' + chalk.red('✖') + ' member `@%s` is not on npm',
        human.github
      )
      continue
    }

    expectedMembers.push(human.npm)

    const actualRole = Object.hasOwn(orgUser, human.npm)
      ? orgUser[human.npm]
      : undefined
    const expectedRole =
      owners.includes(github) || human.npm === context.npmTokenOwner
        ? 'owner'
        : admins.includes(github)
          ? 'admin'
          : 'developer'

    if (actualRole === expectedRole) {
      continue
    }

    if (
      (actualRole === 'owner' &&
        (expectedRole === 'admin' || expectedRole === 'developer')) ||
      (actualRole === 'admin' && expectedRole === 'developer')
    ) {
      console.error(
        '  ' +
          chalk.red('✖') +
          ' unexpected user `%s` with more rights (`%s`) than expected (`%s`), ignoring',
        human.npm,
        actualRole,
        expectedRole
      )
      continue
    }

    // Update or add: both the same request.
    tasks.push(async function () {
      try {
        await fetch(
          'https://registry.npmjs.org/-/org/' +
            encodeURIComponent(npmOrg.npm) +
            '/user',
          {
            body: JSON.stringify({role: expectedRole, user: human.npm}),
            headers: {Authorization: 'Bearer ' + context.npmToken},
            method: 'PUT'
          }
        )

        console.warn(
          '  ' + chalk.green('✔') + ' add npm user `~%s` to `%s` as `%s`',
          human.npm,
          npmOrg.npm,
          expectedRole
        )
      } catch {
        console.error(
          '  ' +
            chalk.red('✖') +
            ' could not add npm user `~%s` to `%s`, make sure the current token’s user (`%s`) is an owner of the org',
          human.npm,
          npmOrg.npm,
          context.npmTokenOwner
        )
      }
    })
  }

  // Remove.
  for (const login of Object.keys(orgUser)) {
    if (!expectedMembers.includes(login)) {
      console.error(
        '  ' + chalk.red('✖') + ' npm user `~%s` should not be in `%s`',
        login,
        npmOrg.npm
      )
    }
  }

  // Teams.
  /** @type {Array<string>} */
  const existingTeams = []

  for (const team of orgTeam) {
    const index = team.indexOf(':')
    assert(index !== -1)
    const orgName = team.slice(0, index)
    assert(orgName === npmOrg.npm)
    const teamName = team.slice(index + 1)
    existingTeams.push(teamName)
  }

  assert(context.npmTeams)

  for (const npmTeam of context.npmTeams) {
    tasks.push(async function () {
      // Create a team if it doesn’t already exist.
      if (!existingTeams.includes(npmTeam.name)) {
        await fetch(
          'https://registry.npmjs.org/-/org/' +
            encodeURIComponent(npmOrg.npm) +
            '/team',
          {
            body: JSON.stringify({
              // Note: there’s no way to get the description on the npm API,
              // so we can’t update that if it’s incorrect.
              description: interpolate(context, npmTeam.description),
              name: npmTeam.name
            }),
            headers: {Authorization: 'Bearer ' + context.npmToken},
            method: 'PUT'
          }
        )

        console.info(
          '    ' + chalk.green('✓') + ' team %s created',
          npmTeam.name
        )
      }

      await teamRun(context, npmOrg, packages, npmTeam)
    })
  }

  // Wait for all tasks.
  await pSeries(tasks)
}

/**
 * @param {Context} context
 * @param {NpmOrg} npmOrg
 * @param {Repo} repo
 * @param {string} manifestFilename
 * @returns {Promise<Package | undefined>}
 */
async function packageRun(context, npmOrg, repo, manifestFilename) {
  // Get `package.json`.

  const target = (repo.defaultBranch || 'master') + ':' + manifestFilename
  /** @type {string | undefined} */
  let objectText

  try {
    const response = /** @type {ObjectResponse} */ (
      await context.ghQuery(
        `
        query($name: String!, $org: String!, $target: String!) {
          repository(name: $name, owner: $org) {
            object(expression: $target) {
              ... on Blob { text }
            }
          }
        }
      `,
        {name: repo.name, org: npmOrg.github, target}
      )
    )

    objectText = response.repository.object?.text
  } catch (error) {
    console.warn(
      '    ' + chalk.blue('ℹ') + ' could not request package at `%s`',
      target,
      error
    )
  }

  /** @type {PackageJson | undefined} */
  let packageData

  if (objectText) {
    try {
      packageData = JSON.parse(objectText)
    } catch {
      console.warn(
        '    ' + chalk.blue('ℹ') + ' package at `%s` is invalid',
        target
      )
    }
  }

  if (!packageData || !packageData.name || packageData.private) {
    console.warn(
      '    ' + chalk.blue('ℹ') + ' package %s at `%s` is private',
      packageData?.name ? '`' + packageData.name + '`' : 'without name',
      target
    )
    return
  }

  // Get collaborators.

  const response = await fetch(
    'https://registry.npmjs.org/-/package/' +
      encodeURIComponent(packageData.name) +
      '/collaborators',
    {headers: {Authorization: 'Bearer ' + context.npmToken}}
  )

  if (!response.ok) {
    console.warn(
      '    ' +
        chalk.red('✖') +
        ' could not get collaborators for `%s`. Is it published?',
      packageData.name
    )
    return
  }

  const actualCollaborators =
    /** @type {Record<string, NpmPermissionShort>} */ (await response.json())

  /** @type {Record<string, NpmPermissionLong>} */
  const permissions = {}
  /** @type {Record<NpmPermissionLong, number>} */
  const score = {'read-only': 0, 'read-write': 1}

  for (const team of context.npmTeams) {
    const members = find(
      context,
      interpolate(
        {
          npmOrg: npmOrg.npm,
          orgTeam: npmOrg.unified,
          org: npmOrg.github
        },
        team.member
      )
    )

    for (const login of members) {
      const permission = Object.hasOwn(permissions, login)
        ? permissions[login]
        : undefined

      if (permission) {
        if (score[team.permission] > score[permission]) {
          permissions[login] = team.permission
        }
      } else {
        permissions[login] = team.permission
      }
    }
  }

  /** @type {Array<string>} */
  const expectedCollaborators = []

  for (const github of Object.keys(permissions)) {
    const permission = permissions[github]
    const human = context.humans.find(function (h) {
      return h.github === github
    })

    // We don’t need to warn for this as it’ll be warned about on the org level.
    if (human && human.npm) {
      const actualPermission = Object.hasOwn(actualCollaborators, human.npm)
        ? actualCollaborators[human.npm]
        : undefined
      const expectedPermission = permission === 'read-write' ? 'write' : 'read'

      // Different permissions.
      if (actualPermission === undefined) {
        console.warn(
          '    wait what? Some collaborator is missing? %s, %s, %j',
          human.name,
          packageData.name,
          actualCollaborators
        )
      } else if (actualPermission !== expectedPermission) {
        console.error(
          '    ' + chalk.red('✖') + ' ~%s should not have %s rights in `%s`',
          human.name,
          actualPermission,
          packageData.name
        )
      }

      expectedCollaborators.push(human.npm)
    }
  }

  // Remove.
  for (const actual of Object.keys(actualCollaborators)) {
    if (!expectedCollaborators.includes(actual)) {
      console.error(
        '    ' + chalk.red('✖') + ' ~%s should not be a collaborator on `%s`',
        actual,
        packageData.name
      )
    }
  }

  // We don’t do missing here: people are added to teams, so they’ll be warned
  // about in the team pipeline.
  const packageArchived = await deprecated(context, packageData.name)

  if (repo.archived) {
    if (!packageArchived) {
      console.error(
        '  ' +
          chalk.red('✖') +
          'unexpected undeprecated package `%s` in archived repo `%s`',
        packageData.name,
        repo.name
      )
    }
  } else if (packageArchived) {
    console.info(
      '    ' +
        chalk.blue('ℹ') +
        ' unexpected deprecated package `%s` in unarchived repo `%s`',
      packageData.name,
      repo.name
    )
  }

  return {name: packageData.name, repo: repo.name}
}

/**
 * @param {Context} context
 * @param {Repo} repo
 * @param {NpmOrg} npmOrg
 * @returns {Promise<Array<Package>>}
 */
async function repoRun(context, repo, npmOrg) {
  if (!repo.defaultBranch) {
    console.warn(
      '  ' + chalk.blue('ℹ') + ' repo %s has no branches yet',
      repo.name
    )
    return []
  }

  if (repo.archived) {
    console.warn('  ' + chalk.blue('ℹ') + ' repo %s is archived', repo.name)
  }

  /** @type {RepositoryResponse} */
  let response

  try {
    response = /** @type {RepositoryResponse} */ (
      await context.ghQuery(
        `
        query($name: String!, $org: String!) {
          repository(name: $name, owner: $org) {
            dependencyGraphManifests {
              nodes {
                blobPath
                exceedsMaxSize
                filename
                parseable
              }
            }
          }
        }
      `,
        {
          headers: {Accept: dependencyGraphAccept},
          name: repo.name,
          org: npmOrg.github
        }
      )
    )
  } catch {
    console.error(
      '    ' +
        chalk.red('✖') +
        ' could not get manifests for %s: maybe they are loading? (in which case, running this again will probably work)',
      repo.name
    )

    return []
  }

  const manifestNodes = response.repository.dependencyGraphManifests.nodes

  /** @type {Array<Package>} */
  const packages = []
  /** @type {Array<() => Promise<undefined>>} */
  const tasks = []

  for (const manifest of manifestNodes) {
    // Only include `package.json`s, not locks.
    if (path.posix.basename(manifest.filename) !== 'package.json') {
      continue
    }

    if (manifest.exceedsMaxSize) {
      console.error(
        '    ' + chalk.red('✖') + ' manifest %s in %s is too big',
        manifest.filename,
        repo.name
      )
      continue
    }

    if (!manifest.parseable) {
      console.error(
        '    ' + chalk.red('✖') + ' manifest %s in %s is not parseable',
        manifest.filename,
        repo.name
      )
      continue
    }

    tasks.push(async function () {
      const result = await packageRun(context, npmOrg, repo, manifest.filename)

      if (result) {
        packages.push(result)
      }
    })
  }

  console.warn('  ' + chalk.bold('packages') + ' for %s', repo.name)
  await pSeries(tasks)

  return packages
}

/**
 * @param {Context} context
 * @param {NpmOrg} npmOrg
 * @param {Array<Package>} npmOrgPackages
 * @param {NpmTeam} npmTeam
 * @returns {Promise<undefined>}
 */
async function teamRun(context, npmOrg, npmOrgPackages, npmTeam) {
  console.info('  ' + chalk.bold('team') + ' %s', npmTeam.name)

  const [actualTeamResponse, actualPackagesResponse] = await Promise.all([
    fetch(
      'https://registry.npmjs.org/-/team/' +
        encodeURIComponent(npmOrg.npm) +
        '/' +
        encodeURIComponent(npmTeam.name) +
        '/user',
      {headers: {Authorization: 'Bearer ' + context.npmToken}}
    ),
    fetch(
      'https://registry.npmjs.org/-/team/' +
        encodeURIComponent(npmOrg.npm) +
        '/' +
        encodeURIComponent(npmTeam.name) +
        '/package',
      {headers: {Authorization: 'Bearer ' + context.npmToken}}
    )
  ])

  // Team members.

  const actualTeam = /** @type {Array<string>} */ (
    await actualTeamResponse.json()
  )

  /** @type {Array<() => Promise<undefined>>} */
  const tasks = []

  const expectedTeamGithub = find(
    context,
    interpolate(
      {
        npmOrg: npmOrg.npm,
        orgTeam: npmOrg.unified,
        org: npmOrg.github
      },
      npmTeam.member
    )
  )
  /** @type {Array<string>} */
  const expectedTeam = []

  for (const github of expectedTeamGithub) {
    const human = context.humans.find(function (h) {
      return h.github === github
    })

    // We don’t need to warn for this as it’ll be warned about on the org level.
    if (human && human.npm) {
      expectedTeam.push(human.npm)
    }
  }

  // Remove (manual).
  for (const login of actualTeam) {
    if (!expectedTeam.includes(login)) {
      console.info(
        '    ' + chalk.red('✖') + ' ~%s should not be in team %s',
        login,
        npmTeam.name
      )
    }
  }

  // Add.
  for (const login of expectedTeam) {
    if (!actualTeam.includes(login)) {
      tasks.push(async function () {
        assert(npmOrg.npm)

        await fetch(
          'https://registry.npmjs.org/-/team/' +
            encodeURIComponent(npmOrg.npm) +
            '/' +
            encodeURIComponent(npmTeam.name) +
            '/user',
          {
            body: JSON.stringify({user: login}),
            headers: {Authorization: 'Bearer ' + context.npmToken},
            method: 'PUT'
          }
        )

        console.info(
          '    ' + chalk.green('✔') + ' add ~%s to %s',
          login,
          npmTeam.name
        )
      })
    }
  }

  // Packages.

  const actualPackages = /** @type {Record<string, NpmPermissionShort>} */ (
    await actualPackagesResponse.json()
  )

  // We don’t need to log for removing packages: each team manages all packages.
  // Packages that need to be removed are thus at the org level.
  // Logging for removal thus happens there.

  // Add packages / fix permissions.
  for (const packageInfo of npmOrgPackages) {
    const name = packageInfo.name
    /** @type {NpmPermissionLong | undefined} */
    const actualPermission = Object.hasOwn(actualPackages, name)
      ? actualPackages[name] === 'write'
        ? 'read-write'
        : 'read-only'
      : undefined

    // Fine.
    if (actualPermission === npmTeam.permission) {
      continue
    }

    // Update or add: both the same request.
    tasks.push(async function () {
      assert(npmOrg.npm)

      try {
        await fetch(
          'https://registry.npmjs.org/-/team/' +
            encodeURIComponent(npmOrg.npm) +
            '/' +
            encodeURIComponent(npmTeam.name) +
            '/package',
          {
            body: JSON.stringify({
              package: name,
              permissions: npmTeam.permission
            }),
            headers: {Authorization: 'Bearer ' + context.npmToken},
            method: 'PUT'
          }
        )

        console.info(
          '    ' + chalk.green('✔') + ' add %s to %s with %s',
          name,
          npmTeam.name,
          npmTeam.permission
        )
      } catch {
        console.info(
          '    ' +
            chalk.red('✖') +
            ' could not add %s to %s, make sure the current token’s user (%s) is an owner',
          name,
          npmTeam.name,
          context.npmTokenOwner
        )
      }
    })
  }

  // Wait for all tasks.
  await pSeries(tasks)
}

/**
 * @param {Context} context
 * @param {string} name
 * @returns {Promise<boolean>}
 */
async function deprecated(context, name) {
  const manifestResponse = await fetch(
    'https://registry.npmjs.org/' + encodeURIComponent(name),
    {headers: {Authorization: 'Bearer ' + context.npmToken}}
  )
  const packument = /** @type {Packument} */ (await manifestResponse.json())
  const version = packument.versions[packument['dist-tags'].latest]
  return 'deprecated' in version
}

/**
 * @param {GraphQl} internalFunction
 * @returns {GraphQl}
 */
function wrap(internalFunction) {
  // @ts-expect-error: fine.
  return wrappedFunction

  /**
   * @param {Parameters<GraphQl>} parameters
   * @returns {ReturnType<GraphQl>}
   */
  function wrappedFunction(...parameters) {
    return attempt().catch(retry)

    /**
     * @returns {ReturnType<GraphQl>}
     */
    function attempt() {
      return internalFunction(...parameters)
    }

    /**
     * @param {unknown} error
     * @returns {Promise<unknown>}
     */
    function retry(error) {
      const exception = /** @type {GraphqlResponseError<unknown>} */ (error)
      console.error('wrap err:', exception)
      console.error('to do:', 'does `status` really not exist?')
      const after =
        // @ts-expect-error: does `status` really not exist?
        exception && exception.status === 403
          ? exception.headers['retry-after']
          : undefined

      if (!after) {
        throw exception
      }

      return new Promise(function (resolve, reject) {
        setTimeout(delayed, Number.parseInt(String(after), 10) * 1000)

        /**
         * @returns {undefined}
         */
        function delayed() {
          attempt().then(resolve, reject)
        }
      })
    }
  }
}
