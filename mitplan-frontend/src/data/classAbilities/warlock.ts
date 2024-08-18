import type { Ability } from '../ability'

const unendingResolve: Ability = {
  name: 'Unending Resolve',
  id: 104773,
  icon: 'spell_shadow_demonicempathy',
  cooldown: 180,
  duration: 8,
  assignmentCategory: 'Personal',
  dr: 0.4
}

const darkPact: Ability = {
  name: 'Dark Pact',
  id: 108416,
  icon: 'spell_shadow_deathpact',
  cooldown: 60,
  duration: 20,
  assignmentCategory: 'Personal',
  dr: 0.2
}

export const warlockAffAbilities = [unendingResolve, darkPact]
export const warlockDestroAbilities = [unendingResolve, darkPact]
export const warlockDemoAbilities = [unendingResolve, darkPact]