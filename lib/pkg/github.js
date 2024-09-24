import chalk from 'chalk'

export async function github(info) {
  const {context, packageManifest, repo} = info
  const {org, ghQuery} = context
  const {name, defaultBranch} = repo
  const {filename} = packageManifest
  const target = [defaultBranch || 'master', filename].join(':')
  let buf

  try {
    const {repository} = await ghQuery(
      `
        query($org: String!, $name: String!, $target: String!) {
          repository(owner: $org, name: $name) {
            object(expression: $target) {
              ... on Blob {
                text
              }
            }
          }
        }
      `,
      {org, name, target}
    )

    buf = (repository.object || {}).text
  } catch (error) {
    console.log(
      '    ' + chalk.blue('ℹ') + ' could not request package at %s',
      target,
      error
    )
  }

  let data

  try {
    data = JSON.parse(buf)
  } catch (_) {
    console.log('    ' + chalk.blue('ℹ') + ' package at %s is invalid', target)
  }

  return {...info, packageData: data}
}
