import type { Ability } from '../ability'

const AntiMagicZone: Ability = {
  name: 'Anti-Magic Zone',
  id: 51052,
  icon: 'spell_deathknight_antimagiczone',
  assignmentCategory: 'Raid CD',
  cooldown: 120,
  duration: 20,
  dr: 0.2
}

const IceboundFortitude: Ability = {
  name: 'Icebound Fortitude',
  id: 48792,
  icon: 'spell_deathknight_iceboundfortitude',
  assignmentCategory: 'Personal',
  cooldown: 180,
  duration: 8,
  dr: 0.3
}

const DancingRuneWeapon: Ability = {
  name: 'Dancing Rune Weapon',
  id: 49028,
  icon: 'inv_sword_07',
  assignmentCategory: 'Tank',
  cooldown: 120,
  duration: 8,
  dr: 0.2
}

const VampiricBlood: Ability = {
  name: 'Vampiric Blood',
  id: 55233,
  icon: 'spell_shadow_lifedrain',
  assignmentCategory: 'Tank',
  cooldown: 90,
  duration: 10,
  // Note: This increases max health by 30% and healing received by 30%
  // You may want to represent this differently depending on your system
  dr: 0.3
}

export const deathKnightFrostAbilities = [
  AntiMagicZone,
  IceboundFortitude
]

export const deathKnightUnholyAbilities = [
  AntiMagicZone,
  IceboundFortitude
]

export const deathKnightBloodAbilities = [
  AntiMagicZone,
  IceboundFortitude,
  DancingRuneWeapon,
  VampiricBlood
]