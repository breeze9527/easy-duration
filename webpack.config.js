const path = require('path');

const CWD = process.cwd();

var output = {
    libraryTarget: process.env.TARGET,
    filename: 'easy-duration.js'
}
switch (process.env.TARGET) {
    case 'umd':
        output.path = path.join(CWD, 'dist/umd');
        library = 'easyDuration';
        break;
    case 'commonjs2':
        output.path = path.join(CWD, 'dist/commonjs');
}

module.exports = {
    context: path.join(CWD, 'es'),
    entry: './index.js',
    output: output,
    mode: 'production'
}
