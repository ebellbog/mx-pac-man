const path = require('path');
const webpack = require('webpack');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function getPlugins(mode) {
    const plugins = [
        new webpack.ProvidePlugin({
            $: 'jquery',
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            filename: path.resolve(__dirname, 'index.html'),
        })
    ];

    if (mode === 'production') {
        plugins.push(new MiniCssExtractPlugin());
    } else {
        plugins.push(new webpack.SourceMapDevToolPlugin({
            filename: '[file].map',
            exclude: [/node_modules.+\.js/]
        }));
    }

    return plugins;
}

module.exports = (env, argv) => {
    return {
        devServer: {
            contentBase: path.resolve(__dirname),
            port: 9000
        },
        devtool: 'eval-cheap-module-source-map',
        entry: './src/index.js',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, argv.mode === 'production' ? 'dist' : ''),
        },
        module: {
            rules: [
                {
                    test: /\.less$/,
                    use: [
                        argv.mode === 'production' ?
                            MiniCssExtractPlugin.loader :
                            'style-loader',
                            'css-loader',
                            'less-loader'
                    ],
                },
                {
                    test: /\.(ttf|otf|png|jpe?g)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: '[name].[ext]'
                            }
                        }
                    ]
                },
                {
                    test: /\.handlebars$/,
                    use: [
                        {
                            loader: 'handlebars-loader',
                            options: {
                                helperDirs: [
                                    path.join(__dirname, 'src', 'templates', 'helpers')
                                ],
                                partialDirs: [
                                    path.join(__dirname, 'src', 'templates', 'partials')
                                ],
                            }
                        }
                    ]
                }
            ]
        },
        plugins: getPlugins(argv.mode),
        resolve: {
            alias: {
                'handlebars': 'handlebars/dist/handlebars.js'
            }
        },
    };
}