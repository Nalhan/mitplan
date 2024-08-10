import type { Ability } from '../ability'

const auraMastery: Ability = {
  name: 'Aura Mastery',
  id: 31821,
  icon: 'spell_holy_auramastery',
  assignmentCategory: 'DR',
  heroTree: 'Paladin Holy',
  dr: 0.2, // Assuming 20% damage reduction, adjust if needed
  drType: 'magic', // Assuming it reduces magic damage, adjust if needed
}

const avengingWrath: Ability = {
  name: 'Avenging Wrath',
  id: 31884,
  icon: 'spell_holy_avenginewrath',
  assignmentCategory: 'Raid CD',
  heroTree: 'Paladin Holy',
  // Add relevant properties for Avenging Wrath
}

const avengingCrusader: Ability = {
  name: 'Avenging Crusader',
  id: 216331,
  icon: 'ability_paladin_veneration',
  heroTree: 'Paladin Holy',
  // Add relevant properties for Avenging Crusader
}

const tyrsDeliverance: Ability = {
  name: "Tyr's Deliverance",
  id: 200652,
  icon: 'inv_mace_2h_artifactsilverhand_d_01',
  assignmentCategory: 'Minor CD',
  heroTree: 'Paladin Holy',
  // Add relevant properties for Tyr's Deliverance
}

const divineToll: Ability = {
  name: 'Divine Toll',
  id: 304971,
  icon: 'ability_bastion_paladin',
  assignmentCategory: 'Minor CD',
  heroTree: 'Paladin Holy',
  // Add relevant properties for Divine Toll
}

const daybreak: Ability = {
  name: 'Daybreak',
  id: 414170,
  icon: 'spell_holy_aspiration',
  assignmentCategory: 'Raid CD',
  heroTree: 'Paladin Holy',
  // Add relevant properties for Daybreak
}

export const paladinHolyAbilities = [
  auraMastery,
  avengingWrath,
  avengingCrusader,
  tyrsDeliverance,
  divineToll,
  daybreak
]

export const paladinRetAbilities = [
]

export const paladinProtAbilities = [
]
