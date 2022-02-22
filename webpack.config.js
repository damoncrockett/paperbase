const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");

const paths = {
  src: path.resolve(__dirname, 'src'),
  dist: path.resolve(__dirname, 'dist')
}

module.exports = {
  entry: path.resolve(paths.src,'index.js'),
  resolve: {
    extensions: ['.js', '.jsx', ],
  },
  output: {
    path: paths.dist, //yarn build will create this dir if it doesn't exist
    filename: 'bundle.js',
    publicPath: '' //where WDS serves bundle.js and index.html from
  },

  devServer: {
    static: paths.dist, //not sure what this does wrt HtmlWebpackPlugin
    /*contentBase: paths.dist,*/
    compress: true,
    port: 8080,
    /*stats: 'errors-only',*/
    open: true
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: paths.src,
        exclude: path.resolve(__dirname, 'node_modules'),
        use: {
          loader: 'buble-loader',
          options: {
            objectAssign: 'Object.assign'
          }
        },
      },
      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
        ]
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html')
    })
  ]
};
