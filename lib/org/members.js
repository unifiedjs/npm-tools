'use strict'

const chalk = require('chalk')
const pSeries = require('p-series')
const find = require('../util/find')

module.exports = members

// See: https://docs.npmjs.com/org-roles-and-permissions
// Note that npm uses `developer` as a role on the API, but `member` on the
// site.
async function members(ctx) {
  const {org, npmOrg, npmRequest, npmTokenOwner, npmOrgs, humans} = ctx
  const owners = find(ctx, npmOrgs.owner)
  const admins = find(ctx, npmOrgs.admin)
  const members = find(ctx, npmOrgs.member)
  const people = [...new Set([...members, ...admins, ...owners])]

  console.log(chalk.bold('members') + ' for %s', org)

  const expected = people
    .map((github) => {
      return humans.find((h) => h.github === github)
    })
    .filter((human) => {
      const {npm} = human

      if (!npm) {
        console.log('  ' + chalk.red('✖') + ' @%s is not on npm', human.github)
      }

      return npm
    })
    .map((human) => ({
      // Usernames on npm are lowercase.
      login: human.npm,
      // Make sure the token owner is always an owner too.
      role:
        owners.includes(human.github) || human.npm === npmTokenOwner
          ? 'owner'
          : admins.includes(human.github)
          ? 'admin'
          : 'member'
    }))

  const {body} = await npmRequest.get(
    '/-/org/' + encodeURIComponent(npmOrg) + '/user'
  )

  const actual = Object.keys(body).map((login) => {
    const role = body[login] === 'developer' ? 'member' : body[login]
    return {login, role}
  })

  // Remove.
  actual
    .filter((x) => !expected.find((y) => x.login === y.login))
    .forEach(({login, role}) => {
      console.log(
        '  ' + chalk.red('✖') + ' ~%s should not be in %s as %s',
        login,
        npmOrg,
        role
      )
    })

  // Add or update humans with missing or unexpected roles.
  await pSeries(
    expected
      .filter((x) => {
        const npmMember = actual.find((y) => x.login === y.login)
        return !npmMember || npmMember.role !== x.role
      })
      .map(({login, role}) => () => {
        return npmRequest
          .put('/-/org/' + encodeURIComponent(npmOrg) + '/user', {
            body: {user: login, role: role === 'member' ? 'developer' : role}
          })
          .then(() => {
            console.log(
              '  ' + chalk.green('✔') + ' add ~%s to %s as %s',
              login,
              npmOrg,
              role
            )
          })
          .catch((error) => {
            if (!error || error.statusCode !== 403) {
              throw error
            }

            console.log(
              '  ' +
                chalk.red('✖') +
                ' could not add ~%s to %s, make sure the current token’s user (%s) is an owner',
              login,
              npmOrg,
              npmTokenOwner
            )
          })
      })
  )
}
