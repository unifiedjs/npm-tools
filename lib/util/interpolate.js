import dlv from 'dlv'

export function interpolate(context, value) {
  return value.replace(/:([\w$.]+)/g, replace)
  function replace($0, $1) {
    return dlv(context, $1)
  }
}
