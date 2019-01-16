/* eslint-disable */
const path = require("path");
const webpack = require("webpack");
const htmlWebpackPlugin = require("html-webpack-plugin");
const cleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
	mode: "development",
	entry:{
		polyfill: ["babel-polyfill"],
		dbmanager: "src/db-manager.js"
	},
	devtool: "inline-source-map",
	module:{
		rules:[
			{
				test: /\.(js)$/,
				exclude: /node_modules/,
				use: ["babel-loader", "eslint-loader"]
			},
			{
				test: /\.css$/,
				exclude: /node_modules/,
				use: ["style-loader","css-loader"]
			},
			{
				test:/\.(png|jpg|gif|svg)$/,
				exclude: /node_modules/,
				loader: "url-loader?limit=10000&name=assets/images/[name]-[sha512:has:base64:7].[ext]"
			},
			{
				test:/\.(eot|ttf|woff|woff2|otf)(\?v=[0-9]\.[0-9]\.[0-9])?&/,
				exclude: /node_modules/,
				loader: "file-loader?name=assets/fonts/[name].[ext]"
			},
			{
				test:/\.html$/,
				use:{
					loader: "html-loader",
					options:{
						attrs:false,
						minimize: false,
						removeCommnets: false,
						collapseWhitespace: false,
					}
				}
			}
		]
	},
	resolve: {
		extensions: ["*",".js"],
		modules: [
			path.resolve("./"),
			path.resolve("./node_modules")
		]
	},
	output:{
		path:path.resolve(__dirname,"build/"),
		publicPath: "/",
		filename: "[name].js",
		chunkFilename: "[name].[chunkhash].chunk.js"
	},
	plugins: [
		new cleanWebpackPlugin(['build']),
		new htmlWebpackPlugin({
			title:'DB Manager',
			template: path.resolve(__dirname,'public/index.html')
		})
	]
};