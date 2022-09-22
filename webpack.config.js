const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    script: './src/script.js',
    game: './src/game.mjs',
    abbreviations: './src/abbreviations.mjs',
    variables: './src/variables.mjs',
    unlimitedScript: './src/uscript.js',
    unlimitedGame: './src/ugame.mjs'
  },
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      chunks: ['script', 'game', 'abbreviations', 'variables']
    }),
    new HtmlWebpackPlugin({
      filename: 'unlimited.html',
      template: 'src/unlimited.html',
      chunks: ['unlimitedScript', 'unlimitedGame', 'abbreviations', 'variables']
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      }
    ],
  },
};
