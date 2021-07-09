import {trough} from 'trough'
import {github} from './github.js'
import {deprecated} from './deprecated.js'
import {collaborators} from './collaborators.js'
import {transform} from './transform.js'

export const pkg = trough()
  .use(github)
  .use(collaborators)
  .use(deprecated)
  .use(transform)
