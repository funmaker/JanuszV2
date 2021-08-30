import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
// Broken https://github.com/ericclemmons/start-server-webpack-plugin/issues/40
//import StartServerPlugin from 'start-server-webpack-plugin';
import StartServerPlugin from 'start-server-nestjs-webpack-plugin';

const root = process.cwd();
const isWin = process.platform === "win32";

const BABEL_OPTIONS = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        node: "current",
      },
    }],
    ["@babel/preset-react", {
      development: true,
    }],
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default {
  mode: 'development',
  target: 'async-node',
  context: root,
  watch: true,
  devtool: 'source-map',
  externals: [nodeExternals({
    allowlist: [isWin ? 'webpack/hot/poll?1000' : 'webpack/hot/signal'],
  })],
  entry: [
    isWin ? 'webpack/hot/poll?1000' : 'webpack/hot/signal',
    './index.js',
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [root, 'node_modules'],
    alias: {
      "react-dom": '@hot-loader/react-dom',
    },
  },
  output: {
    path: path.join(root, 'build'),
    filename: 'index.js',
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  optimization: {
    emitOnErrors: false,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new StartServerPlugin({
      name: 'index.js',
      signal: !isWin,
    }),
  ],
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
