import dlv from 'dlv'

/**
 * @param {object} context
 *   Object to interpolate values from.
 * @param {string} value
 *   Value with interpolation patterns.
 * @returns {string}
 *   Result.
 */
export function interpolate(context, value) {
  return value.replaceAll(/:([\w$.]+)/g, replace)

  /**
   * @param {string} _
   *   Whole.
   * @param {string} $1
   *   Pattern.
   * @returns {string}
   *   Replacement.
   */
  function replace(_, $1) {
    return dlv(context, $1)
  }
}
