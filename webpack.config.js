const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // Use development mode to skip minification
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    sourcePrefix: '',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(glb|gltf|obj|fbx|ifc|las|laz)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|gif|jpg|jpeg|svg|xml|json|glsl|txt)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'BIM/CAD Viewer - 3D Tiles',
    }),
    // Copy plugin removed - using Three.js which doesn't need external assets
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname, 'public'),
      },
    ],
    port: 3000,
    open: false,
    hot: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
};
