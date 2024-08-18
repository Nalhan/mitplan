import type { Ability } from '../ability'

const iceBlock: Ability = {
  name: 'Ice Block',
  id: 45438,
  icon: 'spell_frost_frost',
  cooldown: 240,
  duration: 10,
  assignmentCategory: 'Personal',
  dr: 1
}

export const mageArcaneAbilities = [iceBlock]
export const mageFireAbilities = [iceBlock]
export const mageFrostAbilities = [iceBlock]