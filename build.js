var fs = require('fs-extra');
var rollup = require('rollup');
var commonjs = require('rollup-plugin-commonjs');    // require
var resolve = require('rollup-plugin-node-resolve'); // require from node_modules
var terser = require('rollup-plugin-terser').terser; // minify
var prettier = require('rollup-plugin-prettier');

// clean previous build
fs.removeSync('/dist/browser/blobtree.js')
fs.removeSync('/dist/browser/blobtree.min.js')

async function build(inputOptions, outputOptions) {
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    /*
    console.log(bundle.imports); // an array of external dependencies
    console.log(bundle.exports); // an array of names exported by the entry point
    console.log(bundle.modules); // an array of module objects
    */

    // generate code and a sourcemap
    const { code, map } = await bundle.generate(outputOptions);

    // or write the bundle to disk
    await bundle.write(outputOptions);
}

let external = function (p) {

    return [
        /^@dualbox\/three$/,    // Only mark pure '@dualbox/three' package as external.
        /^three$/,              // Only mark pure 'three' package as external.
        /^three-full$/,         // three-full dependency for packages that still use it.
    ].some(r => r.test(p))
}

var globals = function (p) {
    const base = {
        // 'jquery': '$', // Jquery not used anymore.
    };

    return base[p] || (/three/.test(p) ? "THREE" : null)
};

/*******************************************
 *  Debug build
 ******************************************/

build({
    input: 'src/blobtree.js',
    plugins:  [ commonjs(), resolve() ],
    external: external,
}, {
    format: 'umd',
    name: 'Blobtree',
    file: './dist/browser/blobtree.js',
    globals: globals,
});


/*******************************************
 *  Minified build
 ******************************************/

build({
    input: 'src/blobtree.js',
    plugins:  [
        commonjs(),
        resolve(),
        terser(),
        prettier({
          parser: 'babel',
          tabWidth: 0,
          singleQuote: false,
          bracketSpacing:false
        })
    ],
    external: p => /@dualbox\/three/.test(p),
}, {
    format: 'umd',
    name: 'Blobtree',
    file: './dist/browser/blobtree.min.js',
    globals: s => /@dualbox\/three/.test(s) ? 'THREE' : s,
});

