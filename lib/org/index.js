import {trough} from 'trough'
import {members} from './members.js'
import {packages} from './packages.js'
import {repos} from './repos.js'
import {teams} from './teams.js'

export const org = trough().use(repos).use(packages).use(members).use(teams)
