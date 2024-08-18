import type { Ability } from '../ability'

const dieByTheSword: Ability = {
  name: 'Die by the Sword',
  id: 118038,
  icon: 'ability_warrior_challange',
  cooldown: 180,
  duration: 8,
  assignmentCategory: 'Personal',
  dr: 0.3
}

const enragedRegeneration: Ability = {
  name: 'Enraged Regeneration',
  id: 184364,
  icon: 'ability_warrior_focusedrage',
  cooldown: 120,
  duration: 8,
  assignmentCategory: 'Personal',
  // Note: This is a healing ability, not strictly DR
}

const shieldWall: Ability = {
  name: 'Shield Wall',
  id: 871,
  icon: 'ability_warrior_shieldwall',
  cooldown: 240,
  duration: 8,
  assignmentCategory: 'Tank',
  dr: 0.4
}

const lastStand: Ability = {
  name: 'Last Stand',
  id: 12975,
  icon: 'spell_holy_ashestoashes',
  cooldown: 180,
  duration: 15,
  assignmentCategory: 'Tank',
  // Note: This increases max health by 30%, not strictly DR
}

export const warriorArmsAbilities = [dieByTheSword]
export const warriorFuryAbilities = [enragedRegeneration]
export const warriorProtAbilities = [shieldWall, lastStand]