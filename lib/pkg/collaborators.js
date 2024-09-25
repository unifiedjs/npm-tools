/**
 * @import {PackageJson} from 'type-fest'
 * @import {Context, PackageManifest, Repo} from '../util/types.js'
 */

/**
 * @typedef Info
 * @property {Context} context
 * @property {PackageJson | undefined} packageData
 * @property {PackageManifest} packageManifest
 * @property {Repo} repo
 */

import assert from 'node:assert/strict'
import chalk from 'chalk'
import fetch from 'node-fetch'
import {find} from '../util/find.js'

const score = {
  'read-only': 0,
  'read-write': 1
}

/**
 * @param {Info} info
 * @returns {Promise<undefined>}
 */
export async function collaborators(info) {
  const {context, repo, packageManifest, packageData} = info
  const {humans, npmToken, npmTeams} = context
  assert(npmTeams)
  const {name} = packageData || {}
  const {defaultBranch} = repo
  const {filename} = packageManifest
  const target = [defaultBranch || 'master', filename].join(':')

  // Already warned.
  if (!packageData) {
    return
  }

  if (!name || packageData.private) {
    console.log(
      '    ' + chalk.blue('ℹ') + ' package %s at %s is private',
      name || 'without name',
      target
    )

    return
  }

  const response = await fetch(
    'https://registry.npmjs.org/-/package/' +
      encodeURIComponent(name) +
      '/collaborators',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  /** @type {Record<string, 'read' | 'write'> | undefined} */
  let body

  if (response.ok) {
    body = /** @type {Record<string, 'read' | 'write'>} */ (
      await response.json()
    )
  } else {
    console.log(
      '    ' +
        chalk.red('✖') +
        ' could not get collaborators for %s. Is it published?',
      name
    )

    // Remove `packageData` to act as if we don’t have the package in the future.
    info.packageData = undefined

    return
  }

  const actual = Object.keys(body).map((name) => {
    const permissions = body[name] === 'write' ? 'read-write' : 'read-only'
    return {name, permissions}
  })

  /** @type {Record<string, 'read-only' | 'read-write'>} */
  const npmHumans = {}
  let index = -1

  while (++index < npmTeams.length) {
    const team = npmTeams[index]
    const members = find(context, team.member)
    let offset = -1
    while (++offset < members.length) {
      const human = members[offset]
      if (
        !(human in npmHumans) ||
        score[team.permission] > score[npmHumans[human]]
      ) {
        npmHumans[human] = team.permission
      }
    }
  }

  const expected = Object.keys(npmHumans)
    .map((github) => {
      const {npm} = humans.find((h) => h.github === github) || {}
      return {name: npm, permissions: npmHumans[github]}
    })
    // We don’t need to warn for this as it’ll be warned about on the org level.
    .filter((x) => x.name)

  // Remove.
  index = -1
  while (++index < actual.length) {
    const human = actual[index]
    if (!expected.some((y) => human.name === y.name)) {
      console.log(
        '    ' + chalk.red('✖') + ' ~%s should not be a collaborator on %s',
        human.name,
        name
      )
    }
  }

  // Different permissions.
  index = -1
  while (++index < actual.length) {
    const human = actual[index]
    const ex = expected.find((y) => human.name === y.name)

    if (ex && ex.permissions !== human.permissions) {
      console.log(
        '    ' + chalk.red('✖') + ' ~%s should not have %s rights in %s',
        human.name,
        human.permissions,
        name
      )
    }
  }

  // We don’t do missing here: people are added to teams, so they’ll be warned
  // about in the team pipeline.
}
