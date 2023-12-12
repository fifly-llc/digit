const config = require('./config');
const fs = require('fs');

fs.writeFileSync(config.dataPath, '');