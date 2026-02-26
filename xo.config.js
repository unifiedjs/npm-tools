/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: true,
    rules: {
      complexity: 'off',
      'prefer-destructuring': 'off',
      'promise/prefer-await-to-then': 'off'
    },
    space: true
  }
]

export default xoConfig
