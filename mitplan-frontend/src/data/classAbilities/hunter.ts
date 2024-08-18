import type { Ability } from '../ability'

const aspectOfTheTurtle: Ability = {
  name: 'Aspect of the Turtle',
  id: 186265,
  icon: 'ability_hunter_aspectoftheturtle',
  cooldown: 180,
  duration: 8,
  assignmentCategory: 'Personal',
  dr: 1
}

const deterrence: Ability = {
  name: 'Deterrence',
  id: 19263,
  icon: 'ability_hunter_deterrence',
  cooldown: 120,
  duration: 5,
  assignmentCategory: 'Personal',
  dr: 0.5
}

const feignDeath: Ability = {
  name: 'Feign Death',
  id: 5384,
  icon: 'ability_hunter_feigndeath',
  cooldown: 30,
  duration: 6,
  assignmentCategory: 'Personal',
  dr: 1
}

export const hunterBmAbilities = [aspectOfTheTurtle, deterrence, feignDeath]
export const hunterMmAbilities = [aspectOfTheTurtle, deterrence, feignDeath]
export const hunterSurvAbilities = [aspectOfTheTurtle, deterrence, feignDeath]