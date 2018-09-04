const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const packageJson = require('../package.json');
const DIST_PATH = path.join(cwd, 'dist');

if(!fs.existsSync(DIST_PATH)){
    throw Error('run script: build at first');
}

// copy README.md
fs.copyFileSync(path.join(cwd, 'README.md'), path.join(DIST_PATH, 'README.md'));

// copy yarn.lock
fs.copyFileSync(path.join(cwd, 'yarn.lock'), path.join(DIST_PATH, 'yarn.lock'));

delete packageJson.scripts;
delete packageJson.devDependencies;

packageJson.main = 'commonjs/easy-duration.js';
packageJson.types = 'types';
packageJson.unpkg = 'umd/easy-duration.js';
packageJson.files = [
    "commonjs/",
    "umd/"
]

// generate package.json
fs.writeFileSync(path.join(DIST_PATH, 'package.json'), JSON.stringify(packageJson, null, '  '))