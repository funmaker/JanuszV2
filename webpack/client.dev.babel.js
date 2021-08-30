import path from "path";
import webpack from 'webpack';

const root = process.cwd();

const BABEL_OPTIONS = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        browsers: "last 2 versions",
      },
    }],
    ["@babel/preset-react", {
      development: true,
    }],
  ],
  plugins: [
    'react-hot-loader/babel',
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default {
  mode: 'development',
  target: 'web',
  context: root,
  devtool: 'source-map',
  entry: [
    '@babel/polyfill',
    'webpack-hot-middleware/client',
    './client.jsx',
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.scss'],
    modules: [root, 'node_modules'],
    alias: {
      "react-dom": '@hot-loader/react-dom',
    },
  },
  output: {
    publicPath: '/',
    filename: 'client.js',
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  optimization: {
    emitOnErrors: false,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.js$|\.jsx$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: BABEL_OPTIONS,
      }, {
        test: /\.scss$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
          "sass-loader",
        ],
      }, {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
        ],
      },
    ],
  },
};
