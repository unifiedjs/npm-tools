'use strict'

const chalk = require('chalk')
const find = require('../util/find')

const score = {
  'read-only': 0,
  'read-write': 1
}

module.exports = request

async function request(info) {
  const {ctx, repo, pkg, pkgData} = info
  const {humans, npmRequest, npmTeams} = ctx
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

  let response

  try {
    response = await npmRequest.get(
      '/-/package/' + encodeURIComponent(name) + '/collaborators'
    )
  } catch (error) {
    if (!error || error.statusCode !== 404) {
      throw error
    }

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

  const {body} = response

  const actual = Object.keys(body).map(name => {
    const permissions = body[name] === 'write' ? 'read-write' : 'read-only'
    return {name, permissions}
  })

  const npmHumans = npmTeams.reduce((all, team) => {
    find(ctx, team.member).forEach(h => {
      if (!(h in all) || score[team.permission] > score[all[h]]) {
        all[h] = team.permission
      }
    })
    return all
  }, {})

  const expected = Object.keys(npmHumans)
    .map(github => {
      const {npm} = humans.find(h => h.github === github) || {}
      return {name: npm, permissions: npmHumans[github]}
    })
    // We don’t need to warn for this as it’ll be warned about on the org level.
    .filter(x => x.name)

  // Remove.
  actual
    .filter(x => !expected.find(y => x.name === y.name))
    .forEach(x => {
      console.log(
        '    ' + chalk.red('✖') + ' ~%s should not be a collaborator on %s',
        x.name,
        name
      )
    })

  // Different permissions.
  actual
    .filter(x => {
      const ex = expected.find(y => x.name === y.name)
      return ex && ex.permissions !== x.permissions
    })
    .forEach(x => {
      console.log(
        '    ' + chalk.red('✖') + ' ~%s should not have %s rights in %s',
        x.name,
        x.permissions,
        name
      )
    })

  // We don’t do missing here: people are added to teams, so they’ll be warned
  // about in the team pipeline.
}
