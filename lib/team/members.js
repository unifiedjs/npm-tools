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
    .map(x => npm[x])
    // We don’t need to warn for this as it’ll be warned about on the org level.
    .filter(Boolean)

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
