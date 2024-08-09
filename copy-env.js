const fs = require('fs');
const path = require('path');

const rootEnvPath = path.join(__dirname, '.env');
const frontendEnvPath = path.join(__dirname, 'mitplan-frontend', '.env');

fs.copyFile(rootEnvPath, frontendEnvPath, (err) => {
  if (err) throw err;
  console.log('.env file copied to frontend');
});
