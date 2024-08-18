import type { Ability } from '../ability'

const evasion: Ability = {
  name: 'Evasion',
  id: 5277,
  icon: 'spell_shadow_shadowward',
  cooldown: 120,
  duration: 10,
  assignmentCategory: 'Personal',
  dr: 1 // 100% dodge chance against melee attacks
}

const cloak: Ability = {
  name: 'Cloak of Shadows',
  id: 31224,
  icon: 'spell_shadow_nethercloak',
  cooldown: 120,
  duration: 5,
  assignmentCategory: 'Personal',
  dr: 1 // 100% magic damage reduction
}

export const rogueAssAbilities = [evasion, cloak]
export const rogueOutlawAbilities = [evasion, cloak]
export const rogueSubAbilities = [evasion, cloak]