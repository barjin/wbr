module.exports = {
	"extends": [
	  "@wbr"
	],

	"parserOptions": {
	"project": "./tsconfig.json",
	"tsconfigRootDir": __dirname,
	},
	"ignorePatterns": ["/build/**/*", "/tests/**/*", "/.eslintrc.js", "/jest.config.js"],
}