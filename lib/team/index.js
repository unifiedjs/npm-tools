import trough from 'trough'
import {create} from './create.js'
import {members} from './members.js'
import {packages} from './packages.js'

export const team = trough().use(create).use(members).use(packages)
