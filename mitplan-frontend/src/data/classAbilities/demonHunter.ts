import type { Ability } from '../ability'

const Darkness: Ability = {
  name: 'Darkness',
  id: 196718,
  icon: 'ability_demonhunter_darkness',
  assignmentCategory: 'Raid CD',
  cooldown: 180,
  duration: 8,
  dr: 0.2 // 20% chance to avoid all damage
}

const Blur: Ability = {
  name: 'Blur',
  id: 198589,
  icon: 'ability_demonhunter_blur',
  assignmentCategory: 'Personal',
  cooldown: 60,
  duration: 10,
  dr: 0.2
}

const Netherwalk: Ability = {
  name: 'Netherwalk',
  id: 196555,
  icon: 'spell_warlock_demonsoul',
  assignmentCategory: 'Personal',
  cooldown: 180,
  duration: 6,
  dr: 1 // 100% damage reduction
}

const FieryBrand: Ability = {
  name: 'Fiery Brand',
  id: 204021,
  icon: 'ability_demonhunter_fierybrand',
  assignmentCategory: 'Tank',
  cooldown: 60,
  duration: 8,
  dr: 0.4
}

const DemonSpikes: Ability = {
  name: 'Demon Spikes',
  id: 203720,
  icon: 'ability_demonhunter_demonspikes',
  assignmentCategory: 'Tank',
  cooldown: 20,
  duration: 6,
  dr: 0.2 // This is an approximation, as it increases armor by 100%
}

export const havocAbilities = [
  Darkness,
  Blur,
  Netherwalk
]

export const vengeanceAbilities = [
  Darkness,
  Blur,
  FieryBrand,
  DemonSpikes
]