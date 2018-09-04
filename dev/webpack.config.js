const path = require('path');
const webpack = require('webpack');
const CONTEXT = process.cwd();
const { CheckerPlugin } = require('awesome-typescript-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    context: CONTEXT,
    entry: [
        './test/Duration',
        './dev/index'
    ],
    output: {
        path: path.join(CONTEXT, 'dist'),
        filename: 'index.js'
    },
    mode: 'development',
    resolve: {
        extensions: ['.ts', '.js']
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: 'awesome-typescript-loader'
            }
        ]
    },
    devServer: {
        port: 8081,
        hot: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new CheckerPlugin(),
        new HtmlWebpackPlugin({
            template: path.join(CONTEXT, 'dev/index.html'),
            inject: 'body'
        })
    ]
}