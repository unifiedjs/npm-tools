/**
 * @import {graphql as GraphQl} from '@octokit/graphql'
 */

/**
 * @typedef Context
 *   Context passed around.
 * @property {string} collective
 *   Name of the collective (example: `unified`).
 * @property {GraphQl} ghQuery
 *   Send a request to the GitHub GQL API.
 * @property {string} ghToken
 *   GH token.
 * @property {Array<Human>} humans
 *   All humans.
 * @property {NpmOrgs} npmOrgs
 *   npm orgs.
 * @property {Array<NpmTeam>} npmTeams
 *   Teams from `npm-teams.yml`.
 * @property {string} npmTokenOwner
 *   Username of owner of `npmToken`.
 * @property {string} npmToken
 *   npm token.
 * @property {Array<Team>} teams
 *   All teams.
 *
 * @typedef Human
 * @property {string} email
 * @property {string} github
 * @property {string} name
 * @property {string | undefined} [npm]
 * @property {string | undefined} [url]
 *
 * @typedef NpmOrgs
 * @property {string} admin
 * @property {string} member
 * @property {Array<NpmOrg>} orgs
 * @property {string} owner
 * @property {string} packages
 *
 * @typedef NpmOrg
 *   Organization.
 * @property {string} github
 *   GitHub slug (example: `'unifiedjs'`).
 * @property {string} npm
 *   npm slug (example: `'unifiedjs'`).
 * @property {string} unified
 *   Name of org (example: `'unified'`).
 *
 * @typedef {'read-only' | 'read-write'} NpmPermissionLong
 * @typedef {'read' | 'write'} NpmPermissionShort
 *
 * @typedef {'admin' | 'developer' | 'owner'} NpmRole
 *   npm role.
 *
 * @typedef NpmTeam
 * @property {string} description
 * @property {string} member
 * @property {string} name
 * @property {NpmPermissionLong} permission
 *
 * @typedef PackageManifest
 * @property {string} blobPath
 * @property {boolean} exceedsMaxSize
 * @property {string} filename
 * @property {boolean} parseable
 *
 * @typedef Package
 * @property {string} name
 * @property {boolean} private
 * @property {string} repo
 *
 * @typedef Repo
 * @property {boolean} archived
 * @property {string} name
 * @property {string | undefined} defaultBranch
 *
 * @typedef {'contributor' | 'maintainer' | 'member' | 'merger' | 'releaser'} Role
 *   unified role.
 *
 * @typedef Team
 *   unified team.
 * @property {boolean | undefined} [collective]
 *   Whether this is a collective (overarching) team.
 * @property {Record<string, Role>} humans
 *   Map of GH handles to roles (example: `{wooorm: 'maintainer'}`).
 * @property {string | undefined} [lead]
 *   GH handle of team lead (when not a collective team) (example: `'wooorm'`).
 * @property {string} name
 *   Name of unified team (example: `'remark'`, `'core'`).
 */

export {}
