const adjectives: string[] = [
    'fierce', 'mighty', 'sneaky', 'arcane', 'shadowy', 'holy', 'ferocious', 'cunning',
    'valiant', 'mystic', 'ancient', 'legendary', 'heroic', 'fearsome', 'noble',
    'whimsical', 'jolly', 'mischievous', 'glorious', 'bouncy', 'zany', 'quirky'
];

const nouns: string[] = [
    'kobold', 'ogre', 'murloc', 'gnoll', 'harpy', 'quillboar', 'trogg',
    'centaur', 'naga', 'satyr', 'worgen', 'dragon', 'elemental', 'gargoyle', 'lich'
];

function generateMitplanName(): string {
    const adjective1: string = adjectives[Math.floor(Math.random() * adjectives.length)];
    const adjective2: string = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun: string = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective1}-${adjective2}-${noun}`;
}

export default generateMitplanName;
