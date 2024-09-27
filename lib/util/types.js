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
 *   Person.
 * @property {string} email
 *   Email address.
 * @property {string} github
 *   GitHub handle.
 * @property {string} name
 *   Name.
 * @property {string | undefined} [npm]
 *   npm handle.
 * @property {string | undefined} [url]
 *   URL.
 *
 * @typedef NpmOrgs
 *   Tree structure representing npm access.
 * @property {string} admin
 *   Glob-like pattern for admins.
 * @property {string} member
 *   Glob-like pattern for members.
 * @property {Array<NpmOrg>} orgs
 *   Orgs.
 * @property {string} owner
 *   Glob-like pattern for owners.
 * @property {string} packages
 *   Glob-like pattern for packages.
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
 *   npm permissions.
 *
 * @typedef {'read' | 'write'} NpmPermissionShort
 *   npm permissions.
 *
 * @typedef {'admin' | 'developer' | 'owner'} NpmRole
 *   npm role.
 *
 * @typedef NpmTeam
 *   npm team.
 * @property {string} description
 *   Description.
 * @property {string} member
 *   Glob-like pattern to match members.
 * @property {string} name
 *   Name.
 * @property {NpmPermissionLong} permission
 *   Permission.
 *
 * @typedef PackageManifest
 * @property {string} blobPath
 *   Path to blob.
 * @property {boolean} exceedsMaxSize
 *   Whether the manifest exeeds a certain size.
 * @property {string} filename
 *   Filename.
 * @property {boolean} parseable
 *   Whether the manifest is parseable.
 *
 * @typedef Package
 *   Package.
 * @property {string} name
 *   Name.
 * @property {string} repo
 *   Repo slug.
 *
 * @typedef Repo
 *   Repository.
 * @property {boolean} archived
 *   Whether the repo is archived.
 * @property {string | undefined} defaultBranch
 *   Default branch.
 * @property {string} name
 *   Name.
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
