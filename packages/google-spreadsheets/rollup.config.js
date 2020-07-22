import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import { builtinModules } from 'module'
import { dependencies } from './package.json'

const { NODE_ENV } = process.env
const prod = NODE_ENV === 'production'

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/index.js',
		format: 'cjs',
	},
	external: [...builtinModules, ...Object.keys(dependencies)],
	plugins: [
		resolve(),
		commonjs(),
		prod && terser(),
	],
	// onwarn: (warning, onwarn) => (
	// 	warning.code === 'CIRCULAR_DEPENDENCY'
	// 	&& /[/\\]@plugin[/\\]/.test(warning.message)
	// ) || onwarn(warning),
}
