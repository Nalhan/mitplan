import { EncounterEventType, Encounter } from '../../../types';

const events: EncounterEventType[] = [
  {
    id: 1,
    name: "Ability One",
    simple_name: "Ability 1",
    spellid: 100001,
    timer_dynamic: 10,
    phase_start: 0,
    phase_end: 600,
    color: "#FF0000"
  },
  {
    id: 2,
    name: "Ability Two",
    simple_name: "Ability 2",
    spellid: 100002,
    timer_dynamic: 20,
    phase_start: 0,
    phase_end: 600,
    color: "#00FF00"
  },
  {
    id: 3,
    name: "Ability Three",
    simple_name: "Ability 3",
    spellid: 100003,
    timer_dynamic: 30,
    phase_start: 0,
    phase_end: 600,
    color: "#0000FF"
  }
];

export const Default: Encounter = {
  events,
  name: "Default Encounter",
  id: "default",
  fightLength: 300
};
