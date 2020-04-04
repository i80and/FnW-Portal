const webpack = require('webpack');
const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')

const htmlPlugin = new HtmlWebPackPlugin({
    template: "./src/index.html",
    filename: "./index.html"
});

const faviconPlugin = new FaviconsWebpackPlugin(
  './src/styles/favicon/aperture.png'
);

const compressionPlugin = new CompressionPlugin({
    filename: '[path].br[query]',
    algorithm: 'brotliCompress',
    test: /\.js$|\.css$|\.html$|\.eot?.+$|\.ttf?.+$|\.woff?.+$||\.svg?.+$|\.bin?.+$/,
    compressionOptions: { level: 11 },
    threshold: 10240,
    minRatio: 0.8,
    deleteOriginalAssets: false,
});

module.exports = {
    entry: path.join(__dirname, "src", "js", "App.js"),
    target: 'web',
    plugins: [htmlPlugin, faviconPlugin,  compressionPlugin],
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
            },
            {
                test: /\.(bin)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'assets/'
                        }
                    }
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }
                ]
            },
            {
                test: /\.(jpeg|jpg|png|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'images/'
                        }
                    }
                ]
            },
        ]
    },

    resolve: {
        extensions: ['*', '.js', '.jsx', '.css', '.ttf', '.json']
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: "[name].js",
        publicPath: '',
    },
    devServer: {
        contentBase: './dist'
    },
};
