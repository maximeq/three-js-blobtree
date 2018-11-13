// import de nos plugins
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
    input: './src/blobtree.js',
    output: {
        file: './dist/browser/blobtree.js',
        format: 'cjs'
    },
    external: ['three-full'],
    plugins: [
        commonjs(), // prise en charge de require
        resolve(), // prise en charge des modules depuis node_modules
    ]
};
