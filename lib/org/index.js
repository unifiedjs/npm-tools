import {trough} from 'trough'
import {repos} from './repos.js'
import {packages} from './packages.js'
import {teams} from './teams.js'
import {members} from './members.js'

export const org = trough().use(repos).use(packages).use(members).use(teams)
