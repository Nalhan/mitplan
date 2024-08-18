import type { Ability } from '../ability'

const painSuppression: Ability = {
  name: 'Pain Suppression',
  id: 33206,
  icon: 'spell_holy_painsupression',
  cooldown: 180,
  duration: 8,
  assignmentCategory: 'External',
  dr: 0.4
}

const powerWordBarrier: Ability = {
  name: 'Power Word: Barrier',
  id: 62618,
  icon: 'spell_holy_powerwordbarrier',
  cooldown: 180,
  duration: 10,
  assignmentCategory: 'Raid CD',
  dr: 0.25
}

const guardianSpirit: Ability = {
  name: 'Guardian Spirit',
  id: 47788,
  icon: 'spell_holy_guardianspirit',
  cooldown: 180,
  duration: 10,
  assignmentCategory: 'External',
  // Note: This increases healing received by 60% and prevents death
}

const dispersion: Ability = {
  name: 'Dispersion',
  id: 47585,
  icon: 'spell_shadow_dispersion',
  cooldown: 120,
  duration: 6,
  assignmentCategory: 'Personal',
  dr: 0.75
}

export const priestDiscAbilities = [painSuppression, powerWordBarrier]
export const priestHolyAbilities = [guardianSpirit]
export const priestShadowAbilities = [dispersion]