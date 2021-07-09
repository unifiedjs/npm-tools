import trough from 'trough'
import {packages} from './packages.js'

export const repo = trough().use(packages)
