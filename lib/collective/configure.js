import {graphql} from '@octokit/graphql'

export async function configure(context) {
  const {ghToken, npmToken} = context

  if (!ghToken) {
    throw new Error(
      'Missing GitHub token: expected `context.ghToken` to be set'
    )
  }

  if (!npmToken) {
    throw new Error('Missing npm token: expected `context.npmToken` to be set')
  }

  const query = graphql.defaults({headers: {authorization: 'token ' + ghToken}})

  return {ghQuery: wrap(query), ...context}
}

function wrap(internalFunction) {
  return wrappedFunction

  function wrappedFunction(...parameters) {
    return attempt().catch(retry)

    function attempt() {
      return internalFunction(...parameters)
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
        setTimeout(delayed, Number.parseInt(after, 10) * 1000)

        function delayed() {
          attempt().then(resolve, reject)
        }
      }
    }
  }
}
