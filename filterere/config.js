const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const configFile = fs.readFileSync(path.join(__dirname, 'config.yml'), 'utf8');
const config = yaml.load(configFile);

module.exports = config;
