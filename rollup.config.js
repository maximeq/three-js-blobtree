import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";

const MODULE_NAME = 'Blobtree';
const MODULE_FILENAME = 'three-js-blobtree';
const DIST = './dist'

// external libs which must not be bundled
const externals = p => {
    return [
        /^three$/,
        /three\/examples\/jsm/,
        /three\.module/,
    ]
        .some(e => e.test(p))
}

// globals where the external libs are expected (iife only)
const globals = p => {
    return /three/.test(p) ? 'THREE' : null;
}

export default {
    // entrypoint
    input: './src/check-wrapper.js',

    // common options
    plugins: [
        typescript(),
        commonjs(), // handles requires in CJS dependancies
        nodeResolve(), // resolves node_module dependancies
    ],
    external: externals,

    // specific options
    output: [

        {   // for bundlers
            format: 'esm',
            file: `${DIST}/${MODULE_FILENAME}.mjs`,
        },

        {   // for node
            format: 'cjs',
            file: `${DIST}/${MODULE_FILENAME}.cjs`,
        },

        {   // for browser (debug)
            format: 'iife',
            name: MODULE_NAME,
            globals: globals,
            file: `${DIST}/${MODULE_FILENAME}.js`,
            sourcemap: true, // for easier debugging in dev tools
        },

        {   // for browser (minified)
            format: 'iife',
            name: MODULE_NAME,
            globals: globals,
            file: `${DIST}/${MODULE_FILENAME}.min.js`,
            plugins: [
                terser(), // minify
            ]
        },
    ]
};
