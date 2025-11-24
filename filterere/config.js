const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const configFile = fs.readFileSync(path.join(__dirname, 'shared', 'config.yml'), 'utf8');
const config = yaml.load(configFile);

// Overrides for Firebase Functions
config.settings.useFirestoreForTimestamp = true;
config.settings.isFirebaseFunctions = true;

module.exports = config;
