var path = require('path');
var webpackConfig = require('webpack-config');
var CopyWebpackPlugin = require('copy-webpack-plugin');

if (process.env.MVD_DESKTOP_DIR == null) {
  throw new Error('You must specify MVD_DESKTOP_DIR in your environment');
}

var config = {
  'entry': [
    path.resolve(__dirname, './src/plugin.ts')
  ],
  'output': {
    'path': path.resolve(__dirname, '../web'),
    'filename': 'main.js',
  },
    'module': {
    'rules': [
      {
        test: /\.scss$/,
        'use': [
          "to-string-loader",  
          "css-loader",  
          "sass-loader" 
        ]
      }
     
    ],
  },
  'plugins': [
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './src/assets'),
        to: path.resolve('../web/assets')
      }
    ])
  ]
};

module.exports = new webpackConfig.Config()
  .extend(path.resolve(process.env.MVD_DESKTOP_DIR, 'plugin-config/webpack.base.js'))
  .merge(config);
