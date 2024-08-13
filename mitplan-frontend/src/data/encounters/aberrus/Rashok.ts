import { EncounterEventType, Encounter } from '../../../types';

const events: EncounterEventType[] = [
  {
    id: 2,
    name: "Searing Slam",
    simple_name: "Jump AOE 245k",
    spellid: 405822,
    timer_dynamic: 14,
    phase_start: 0,
    phase_end: 600,
    color: "#FF4500"
  },
  {
    id: 3,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 23,
    phase_start: 0,
    phase_end: 600,
    color: "#8A2BE2"
  },
  {
    id: 4,
    name: "Charged Smash",
    simple_name: "Meteor Soak + Clears",
    spellid: 400777,
    timer_dynamic: 26,
    phase_start: 0,
    phase_end: 600,
    color: "#FFD700"
  },
  {
    id: 5,
    name: "Debuff Clears",
    simple_name: "Clear pt 2",
    spellid: 405828,
    timer_dynamic: 30,
    phase_start: 0,
    phase_end: 600,
    color: "#00FF00"
  },
  {
    id: 6,
    name: "Run Doom Flames",
    simple_name: "Soaks Run",
    spellid: 406851,
    timer_dynamic: 41,
    phase_start: 0,
    phase_end: 600,
    color: "#FF1493"
  },
  {
    id: 7,
    name: "Soak Doom Flames",
    simple_name: "Soak",
    spellid: 406851,
    timer_dynamic: 49,
    phase_start: 0,
    phase_end: 600,
    color: "#FF1493"
  },
  {
    id: 8,
    name: "Searing Slam",
    simple_name: "Jump AOE 295k",
    spellid: 405822,
    timer_dynamic: 57,
    phase_start: 0,
    phase_end: 600,
    color: "#FF4500"
  },
  {
    id: 9,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 68,
    phase_start: 0,
    phase_end: 600,
    color: "#8A2BE2"
  },
  {
    id: 10,
    name: "Charged Smash",
    simple_name: "Meteor Soak + Clears",
    spellid: 400777,
    timer_dynamic: 69,
    phase_start: 0,
    phase_end: 600,
    color: "#FFD700"
  },
  {
    id: 11,
    name: "Debuff Clears",
    simple_name: "Clear pt 2",
    spellid: 405828,
    timer_dynamic: 73,
    phase_start: 0,
    phase_end: 600,
    color: "#00FF00"
  },
  {
    id: 12,
    name: "Searing Slam",
    simple_name: "Jump AOE 340k",
    spellid: 405822,
    timer_dynamic: 90,
    phase_start: 0,
    phase_end: 600,
    color: "#FF4500"
  },
  {
    id: 13,
    name: "Shadowlava Blast",
    simple_name: "Frontal Bait",
    spellid: 406333,
    timer_dynamic: 98,
    phase_start: 0,
    phase_end: 600,
    color: "#FFA500"
  },
  {
    id: 14,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 102,
    phase_start: 0,
    phase_end: 600,
    color: "#8A2BE2"
  },
  {
    id: 15,
    name: "Elder's Conduit",
    simple_name: "Intermission",
    spellid: 404448,
    timer_dynamic: 112,
    phase_start: 0,
    phase_end: 600,
    duration: 20,
    color: "#1E90FF"
  },
  {
    id: 20,
    name: "Searing Slam",
    simple_name: "Jump AOE 390k",
    spellid: 405822,
    timer_dynamic: 36,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#FF4500"
  },
  {
    id: 21,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 44,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#8A2BE2"
  },
  {
    id: 22,
    name: "Charged Smash",
    simple_name: "Meteor Soak + Clears",
    spellid: 400777,
    timer_dynamic: 48,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#FFD700"
  },
  {
    id: 23,
    name: "Debuff Clears",
    simple_name: "Clear pt 2",
    spellid: 405828,
    timer_dynamic: 52,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#00FF00"
  },
  {
    id: 24,
    name: "Run Doom Flames",
    simple_name: "Soaks Run",
    spellid: 406851,
    timer_dynamic: 64,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#FF1493"
  },
  {
    id: 25,
    name: "Soak Doom Flames",
    simple_name: "Soak",
    spellid: 406851,
    timer_dynamic: 72,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#FF1493"
  },
  {
    id: 26,
    name: "Searing Slam",
    simple_name: "Jump AOE 440k",
    spellid: 405822,
    timer_dynamic: 79,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#FF4500"
  },
  {
    id: 27,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 90,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#8A2BE2"
  },
  {
    id: 28,
    name: "Charged Smash",
    simple_name: "Meteor Soak + Clears",
    spellid: 400777,
    timer_dynamic: 95,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#FFD700"
  },
  {
    id: 29,
    name: "Debuff Clears",
    simple_name: "Clear pt 2",
    spellid: 405828,
    timer_dynamic: 99,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#00FF00"
  },
  {
    id: 30,
    name: "Searing Slam",
    simple_name: "Jump AOE 490k",
    spellid: 405822,
    timer_dynamic: 112,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#FF4500"
  },
  {
    id: 31,
    name: "Shadowlava Blast",
    simple_name: "Frontal Bait",
    spellid: 406333,
    timer_dynamic: 122,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#FFA500"
  },
  {
    id: 32,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 123,
    phase_start: 112,
    phase_end: 600,
    cleu: "SAA:401419:1",
    color: "#8A2BE2"
  },
  {
    id: 33,
    name: "Elder's Conduit",
    simple_name: "Intermission",
    spellid: 404448,
    timer_dynamic: 135,
    phase_start: 112,
    phase_end: 600,
    duration: 20,
    cleu: "SAA:401419:1",
    color: "#1E90FF"
  },
  {
    id: 38,
    name: "Searing Slam",
    simple_name: "Jump AOE 540k",
    spellid: 405822,
    timer_dynamic: 37,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FF4500"
  },
  {
    id: 39,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 44,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#8A2BE2"
  },
  {
    id: 40,
    name: "Charged Smash",
    simple_name: "Meteor Soak",
    spellid: 400777,
    timer_dynamic: 48,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FFD700"
  },
  {
    id: 41,
    name: "Run Doom Flames",
    simple_name: "Soaks Run",
    spellid: 406851,
    timer_dynamic: 64,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FF1493"
  },
  {
    id: 42,
    name: "Soak Doom Flames",
    simple_name: "Soak",
    spellid: 406851,
    timer_dynamic: 72,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FF1493"
  },
  {
    id: 43,
    name: "Searing Slam",
    simple_name: "Jump AOE 585k",
    spellid: 405822,
    timer_dynamic: 83,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FF4500"
  },
  {
    id: 44,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 90,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#8A2BE2"
  },
  {
    id: 45,
    name: "Charged Smash",
    simple_name: "Meteor Soak",
    spellid: 400777,
    timer_dynamic: 95,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FFD700"
  },
  {
    id: 46,
    name: "Searing Slam",
    simple_name: "Jump AOE 625k",
    spellid: 405822,
    timer_dynamic: 115,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FF4500"
  },
  {
    id: 47,
    name: "Shadowlava Blast",
    simple_name: "Frontal Bait",
    spellid: 406333,
    timer_dynamic: 122,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FFA500"
  },
  {
    id: 48,
    name: "Shadowflame Energy",
    simple_name: "Heal Absorb",
    spellid: 410077,
    timer_dynamic: 123,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#8A2BE2"
  },
  {
    id: 49,
    name: "Enrage",
    simple_name: "Enrage",
    spellid: 0,
    timer_dynamic: 143,
    phase_start: 247,
    phase_end: 600,
    cleu: "SAA:401419:2",
    color: "#FF0000"
  }
];

export const Rashok: Encounter = {
  events,
  name: "Rashok, the Elder",
  id: "rashok",
  fightLength: 400
};