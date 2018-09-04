const semver = require('semver');
const spawn = require('cross-spawn');
const path = require('path');

var currentVersion = process.env.npm_package_version;
var releaseType = process.argv[2] || 'patch';
var newVersion = semver.inc(currentVersion, releaseType);
var newVersionStr = 'v' + newVersion;

var spawnOption = {
    cwd: process.cwd(),
    stdio: 'inherit'
}

// update version field in package.json
spawn.sync('yarn', ['version', '--no-git-tag-version', newVersion], spawnOption);

spawn.sync('git', ['add', './package.json'], spawnOption);
spawn.sync('git', ['add', './HISTORY.md'], spawnOption);

spawn.sync('git', ['commit', '-m', 'Release: ' + newVersionStr], spawnOption);
spawn.sync('git', ['tag', newVersionStr, '-am', 'Release: ' + newVersionStr], spawnOption);
