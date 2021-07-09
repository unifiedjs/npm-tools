import {graphql} from '@octokit/graphql'

export async function configure(ctx) {
  const {ghToken, npmToken} = ctx

  if (!ghToken) {
    throw new Error('Missing GitHub token: expected `ctx.ghToken` to be set')
  }

  if (!npmToken) {
    throw new Error('Missing npm token: expected `ctx.npmToken` to be set')
  }

  const query = graphql.defaults({headers: {authorization: 'token ' + ghToken}})

  return {ghQuery: wrap(query), ...ctx}
}

function wrap(fn) {
  return wrapped

  function wrapped(...args) {
    return attempt().catch(retry)

    function attempt() {
      return fn(...args)
    }

    function retry(error) {
      console.log('wrap error:')
      console.dir(error, {depth: null})
      const after =
        error && error.status === 403 ? error.headers['retry-after'] : null

      if (!after) {
        throw error
      }

      return new Promise(executor)

      function executor(resolve, reject) {
        setTimeout(delayed, parseInt(after, 10) * 1000)

        function delayed() {
          attempt().then(resolve, reject)
        }
      }
    }
  }
}
