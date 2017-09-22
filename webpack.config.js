module.exports = {
  entry: './src/js/index',
  output: {
    filename: './dist/main.js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.(png|jpg|gif)$/, 
        loader: 'url-loader',
      }
    ]
  }
};