'use strict'

const chalk = require('chalk')
const fetch = require('node-fetch')
const pSeries = require('p-series')
const find = require('../util/find.js')

module.exports = members

// Add humans to a team, warn about humans that shouldn’t be there.
async function members(info) {
  const {ctx, structure} = info
  const {humans, npmOrg, npmToken} = ctx
  const {name, member} = structure

  const response = await fetch(
    'https://registry.npmjs.org/-/team/' +
      encodeURIComponent(npmOrg) +
      '/' +
      encodeURIComponent(name) +
      '/user',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  const body = await response.json()

  const actual = body
  const expected = find(ctx, member)
    .map((github) => {
      return (humans.find((h) => h.github === github) || {}).npm
    })
    // We don’t need to warn for this as it’ll be warned about on the org level.
    .filter(Boolean)

  // Remove.
  let index = -1
  while (++index < actual.length) {
    const login = actual[index]
    if (!expected.includes(login)) {
      console.log(
        '    ' + chalk.red('✖') + ' ~%s should not be in team %s',
        login,
        name
      )
    }
  }

  // Add missing humans.
  await pSeries(
    expected
      .filter((x) => !actual.includes(x))
      .map((user) => () => {
        return fetch(
          'https://registry.npmjs.org/-/team/' +
            encodeURIComponent(npmOrg) +
            '/' +
            encodeURIComponent(name) +
            '/user',
          {
            method: 'PUT',
            body: JSON.stringify({user}),
            headers: {Authorization: 'Bearer ' + npmToken}
          }
        ).then(() => {
          console.log('    ' + chalk.green('✔') + ' add ~%s to %s', user, name)
        })
      })
  )
}
