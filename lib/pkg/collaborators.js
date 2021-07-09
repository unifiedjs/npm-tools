import chalk from 'chalk'
import fetch from 'node-fetch'
import {find} from '../util/find.js'

const score = {
  'read-only': 0,
  'read-write': 1
}

export async function collaborators(info) {
  const {ctx, repo, pkg, pkgData} = info
  const {humans, npmToken, npmTeams} = ctx
  const {name} = pkgData || {}
  const {defaultBranch} = repo
  const {filename} = pkg
  const target = [defaultBranch || 'master', filename].join(':')

  // Already warned.
  if (!pkgData) {
    return
  }

  if (!name || pkgData.private) {
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

  let body

  if (response.ok) {
    body = await response.json()
  } else {
    console.log(
      '    ' +
        chalk.red('✖') +
        ' could not get collaborators for %s. Is it published?',
      name
    )

    // Remove `pkgData` to act as if we don’t have the package in the future.
    info.pkgData = undefined

    return
  }

  const actual = Object.keys(body).map((name) => {
    const permissions = body[name] === 'write' ? 'read-write' : 'read-only'
    return {name, permissions}
  })

  const npmHumans = {}
  let index = -1

  while (++index < npmTeams.length) {
    const team = npmTeams[index]
    const members = find(ctx, team.member)
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
