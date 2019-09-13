import webpack from 'webpack';
import path from 'path';
import nodeExternals from 'webpack-node-externals';
import StartServerPlugin from 'start-server-webpack-plugin';

const root = process.cwd();

// noinspection JSUnusedGlobalSymbols
export default {
	mode: 'development',
	target: 'async-node',
	context: root,
	watch: true,
	devtool: 'source-map',
	stats: 'errors-only',
	externals: [nodeExternals({
		whitelist: ['webpack/hot/signal'],
	})],
	entry: [
		'webpack/hot/signal',
		'./index.js',
	],
	resolve: {
		extensions: ['.js', '.jsx'],
		modules: [root, 'node_modules'],
		alias: {
			"react-dom": '@hot-loader/react-dom'
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
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NamedModulesPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		new webpack.DefinePlugin({
			'process.env.FLUENTFFMPEG_COV': false
		}),
		new StartServerPlugin({
			name: 'index.js',
			signal: true,
		}),
	],
	module: {
		rules: [
			{
				test: /\.js$|\.jsx$/,
				exclude: /(node_modules)/,
				loader: 'babel-loader',
				options: {
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
						"@babel/plugin-proposal-object-rest-spread",
						["@babel/plugin-proposal-decorators", { legacy: true }],
						["@babel/plugin-proposal-class-properties", { loose: true }]
					],
				},
			}, {
				test: /\.handlebars$/,
				loader: 'handlebars-loader',
			},
		],
	},
};
