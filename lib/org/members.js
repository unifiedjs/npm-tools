import chalk from 'chalk'
import fetch from 'node-fetch'
import pSeries from 'p-series'
import {find} from '../util/find.js'

// See: https://docs.npmjs.com/org-roles-and-permissions
// Note that npm uses `developer` as a role on the API, but `member` on the
// site.
export async function members(context) {
  const {org, npmOrg, npmToken, npmTokenOwner, npmOrgs, humans} = context
  const owners = find(context, npmOrgs.owner)
  const admins = find(context, npmOrgs.admin)
  const members = find(context, npmOrgs.member)
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

  const response = await fetch(
    'https://registry.npmjs.org/-/org/' + encodeURIComponent(npmOrg) + '/user',
    {headers: {Authorization: 'Bearer ' + npmToken}}
  )

  const body = await response.json()

  const actual = Object.keys(body).map((login) => {
    const role = body[login] === 'developer' ? 'member' : body[login]
    return {login, role}
  })

  // Remove.
  let index = -1
  while (++index < actual.length) {
    const member = actual[index]
    if (!expected.some((y) => member.login === y.login)) {
      console.log(
        '  ' + chalk.red('✖') + ' ~%s should not be in %s as %s',
        member.login,
        npmOrg,
        member.role
      )
    }
  }

  // Add or update humans with missing or unexpected roles.
  await pSeries(
    expected
      .filter((x) => {
        const npmMember = actual.find((y) => x.login === y.login)
        return !npmMember || npmMember.role !== x.role
      })
      .map(({login, role}) => () => {
        return fetch(
          'https://registry.npmjs.org/-/org/' +
            encodeURIComponent(npmOrg) +
            '/user',
          {
            method: 'PUT',
            body: JSON.stringify({
              user: login,
              role: role === 'member' ? 'developer' : role
            }),
            headers: {Authorization: 'Bearer ' + npmToken}
          }
        )
          .then(() => {
            console.log(
              '  ' + chalk.green('✔') + ' add ~%s to %s as %s',
              login,
              npmOrg,
              role
            )
          })
          .catch((error) => {
            console.log('members:err:', error)
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
