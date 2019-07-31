'use strict'

const chalk = require('chalk')
const pSeries = require('p-series')
const find = require('../util/find')

module.exports = members

// See: https://docs.npmjs.com/org-roles-and-permissions
// Note that npm uses `developer` as a role on the API, but `member` on the
// site.
async function members(ctx) {
  const {org, npm, npmRequest, npmTokenOwner, orgStructure} = ctx
  const owners = find(ctx, orgStructure.humans.owner)
  const admins = find(ctx, orgStructure.humans.admin)
  const members = find(ctx, orgStructure.humans.member)
  const people = [...new Set([...members, ...admins, ...owners])]

  console.log(chalk.bold('members') + ' for %s', org)

  const expected = people
    .filter(name => {
      const login = npm[name]

      if (!login) {
        console.log('  ' + chalk.red('✖') + ' @%s is not on npm', name)
      }

      return login
    })
    .map(name => ({
      // Usernames on npm are lowercase.
      login: npm[name],
      // Make sure the token owner is always an owner too.
      role:
        owners.includes(name) || npm[name] === npmTokenOwner
          ? 'owner'
          : admins.includes(name)
          ? 'admin'
          : 'member'
    }))

  const {body} = await npmRequest.get(
    '/-/org/' + encodeURIComponent(org) + '/user'
  )

  const actual = Object.keys(body).map(login => {
    const role = body[login] === 'developer' ? 'member' : body[login]
    return {login, role}
  })

  // Remove.
  actual
    .filter(x => !expected.find(y => x.login === y.login))
    .forEach(({login, role}) => {
      console.log(
        '  ' + chalk.red('✖') + ' ~%s should not be in %s as %s',
        login,
        org,
        role
      )
    })

  // Add or update humans with missing or unexpected roles.
  await pSeries(
    expected
      .filter(x => {
        const npmMember = actual.find(y => x.login === y.login)
        return !npmMember || npmMember.role !== x.role
      })
      .map(({login, role}) => () => {
        return npmRequest
          .put('/-/org/' + encodeURIComponent(org) + '/user', {
            body: {user: login, role: role === 'member' ? 'developer' : role}
          })
          .then(() => {
            console.log(
              '  ' + chalk.green('✔') + ' add ~%s to %s as %s',
              login,
              org,
              role
            )
          })
          .catch(error => {
            if (!error || error.statusCode !== 403) {
              throw error
            }

            console.log(
              '  ' +
                chalk.red('✖') +
                ' could not add ~%s to %s, make sure the current token’s user (%s) is an owner',
              login,
              org,
              npmTokenOwner
            )
          })
      })
  )
}
