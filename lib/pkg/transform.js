/**
 * @import {PackageJson} from 'type-fest'
 * @import {Context, PackageManifest, Package, Repo} from '../util/types.js'
 */

''

/**
 * @typedef Info
 * @property {Context} context
 * @property {PackageJson | undefined} packageData
 * @property {PackageManifest} packageManifest
 * @property {Repo} repo
 */

/**
 * @param {Info} info
 * @returns {Promise<Package>}
 */
export async function transform(info) {
  const {packageData} = info
  const {name, private: priv} = packageData || {}
  return {
    name,
    private: Boolean(!packageData || !name || priv),
    repo: undefined
  }
}
