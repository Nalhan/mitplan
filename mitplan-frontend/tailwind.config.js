module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        'warrior': '#C79C6E',
        'paladin': '#F58CBA',
        'hunter': '#ABD473',
        'rogue': '#FFF569',
        'priest': '#FFFFFF',
        'deathknight': '#C41F3B',
        'shaman': '#0070DE',
        'mage': '#69CCF0',
        'warlock': '#9482C9',
        'monk': '#00FF96',
        'druid': '#FF7D0A',
        'demonhunter': '#A330C9',
        'evoker': '#33937F',
      },
    },
  },

  
  // ... other configurations
};