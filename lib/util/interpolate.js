import dlv from 'dlv'

export function interpolate(context, value) {
  return value.replaceAll(/:([\w$.]+)/g, replace)
  function replace($0, $1) {
    return dlv(context, $1)
  }
}
