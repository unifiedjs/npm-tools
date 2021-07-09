import trough from 'trough'
import {configure} from './configure.js'
import {orgs} from './orgs.js'
import {user} from './user.js'

export const collective = trough().use(configure).use(user).use(orgs)
