/**
 * @import {graphql as GraphQl, GraphqlResponseError} from '@octokit/graphql'
 * @import {Context} from '../util/types.js'
 */

import {graphql} from '@octokit/graphql'

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
export async function configure(context) {
  const {ghToken} = context

  if (!ghToken) {
    throw new Error(
      'Missing GitHub token: expected `context.ghToken` to be set'
    )
  }

  const query = graphql.defaults({headers: {authorization: 'token ' + ghToken}})

  return {
    ...context,
    ghQuery: wrap(query)
  }
}

/**
 *
 * @param {GraphQl} internalFunction
 * @returns {GraphQl}
 */
function wrap(internalFunction) {
  // @ts-expect-error: fine.
  return wrappedFunction

  /**
   * @param {Parameters<GraphQl>} parameters
   * @returns {ReturnType<GraphQl>}
   */
  function wrappedFunction(...parameters) {
    return attempt().catch(retry)

    /**
     * @returns {ReturnType<GraphQl>}
     */
    function attempt() {
      return internalFunction(...parameters)
    }

    /**
     * @param {unknown} error
     * @returns {Promise<unknown>}
     */
    function retry(error) {
      const exception = /** @type {GraphqlResponseError<unknown>} */ (error)
      console.error('wrap err:', exception)
      console.error('to do:', 'does `status` really not exist?')
      const after =
        // @ts-expect-error: does `status` really not exist?
        exception && exception.status === 403
          ? exception.headers['retry-after']
          : undefined

      if (!after) {
        throw exception
      }

      return new Promise(function (resolve, reject) {
        setTimeout(delayed, Number.parseInt(String(after), 10) * 1000)

        /**
         * @returns {undefined}
         */
        function delayed() {
          attempt().then(resolve, reject)
        }
      })
    }
  }
}
