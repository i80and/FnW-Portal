const webpack = require('webpack');
const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");

const htmlPlugin = new HtmlWebPackPlugin({
    template: "./src/index.html",
    filename: "./index.html"
});

module.exports = {
    entry: path.join(__dirname, "src", "js", "app.js"),
    plugins: [htmlPlugin],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test:/\.css$/,
                use:['style-loader','css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.css']
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: "[name].js",
        publicPath: '/',
    },
    devServer: {
        contentBase: './dist'
    }
};