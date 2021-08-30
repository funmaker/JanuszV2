import path from 'path';
import nodeExternals from 'webpack-node-externals';

const root = process.cwd();

const BABEL_OPTIONS = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        node: "current",
      },
    }],
    "@babel/preset-react",
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default {
  mode: 'production',
  target: 'async-node',
  context: root,
  devtool: 'source-map',
  externals: [nodeExternals()],
  entry: './index.js',
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [root, 'node_modules'],
  },
  output: {
    path: path.join(root, 'dist'),
    filename: 'index.js',
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  node: {
    __filename: false,
    __dirname: false,
  },
  plugins: [],
  module: {
    rules: [
      {
        test: /\.js$|\.jsx$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: BABEL_OPTIONS,
      }, {
        test: /\.handlebars$/,
        loader: 'handlebars-loader',
      },
    ],
  },
};
