const adjectives = [
    'fierce', 'mighty', 'sneaky', 'arcane', 'shadowy', 'holy', 'ferocious', 'cunning',
    'valiant', 'mystic', 'ancient', 'legendary', 'heroic', 'fearsome', 'noble',
    'whimsical', 'jolly', 'mischievous', 'glorious', 'bouncy', 'zany', 'quirky'
  ];
  
const nouns = [
    'kobold', 'ogre', 'murloc', 'gnoll', 'harpy', 'quillboar', 'trogg',
    'centaur', 'naga', 'satyr', 'worgen', 'dragon', 'elemental', 'gargoyle', 'lich'
];

function generateRoomName() {
    const adjective1 = adjectives[Math.floor(Math.random() * adjectives.length)];
    const adjective2 = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective1}-${adjective2}-${noun}`;
  }
  
module.exports = generateRoomName;
