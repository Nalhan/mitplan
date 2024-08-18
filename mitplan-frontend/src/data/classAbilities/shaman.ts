import type { Ability } from '../ability'

const astralShift: Ability = {
  name: 'Astral Shift',
  id: 108271,
  icon: 'ability_shaman_astralshift',
  cooldown: 90,
  duration: 8,
  assignmentCategory: 'Personal',
  dr: 0.4
}

const spiritLink: Ability = {
  name: 'Spirit Link Totem',
  id: 98008,
  icon: 'spell_shaman_spiritlink',
  cooldown: 180,
  duration: 6,
  assignmentCategory: 'Raid CD',
  // Note: This ability redistributes health, not strictly DR
}

export const shamanEnhAbilities = [astralShift]
export const shamanEleAbilities = [astralShift]
export const shamanRestoAbilities = [astralShift, spiritLink]