'use strict'

const chalk = require('chalk')
const pSeries = require('p-series')
const find = require('../util/find')

module.exports = members

// Add humans to a team, warn about humans that shouldn’t be there.
async function members(info) {
  const {structure, ctx} = info
  const {name, humans} = structure
  const {npmRequest, org, npm} = ctx

  const {body} = await npmRequest.get(
    '/-/team/' +
      encodeURIComponent(org) +
      '/' +
      encodeURIComponent(name) +
      '/user'
  )

  const actual = body
  const expected = find(ctx, humans)
    .filter(name => {
      const login = npm[name]

      if (!login) {
        console.log('    ' + chalk.red('✖') + ' @%s is not on npm', name)
      }

      return login
    })
    .map(x => npm[x])

  // Remove.
  actual
    .filter(x => !expected.includes(x))
    .forEach(login => {
      console.log(
        '    ' + chalk.red('✖') + ' ~%s should not be in team %s',
        login,
        name
      )
    })

  // Add missing humans.
  await pSeries(
    expected
      .filter(x => !actual.includes(x))
      .map(user => () => {
        return npmRequest
          .put(
            '/-/team/' +
              encodeURIComponent(org) +
              '/' +
              encodeURIComponent(name) +
              '/user',
            {body: {user}}
          )
          .then(() => {
            console.log(
              '    ' + chalk.green('✔') + ' add ~%s to %s',
              user,
              name
            )
          })
      })
  )
}
