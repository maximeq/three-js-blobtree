var fs = require('fs-extra');
var browserify = require('browserify');
var tinyify = require('tinyify');

/*******************************************
 *  Debug build
 ******************************************/

// prepare browserify with debug options
var b = browserify(null, {
    'fullPaths' : false,
    'debug' : true,
    'standalone' : 'Blobtree'
});

// make three-full an extern dependency
b.external('THREE');
b.require('./src/blobtree.js', { expose: 'Blobtree' });

// build bundle
var bundleStandard = b.bundle().on('error', function(e) {
    console.error(e);
    throw e;
    process.exit(1);
});

// pipe bundle to output file
bundleStandard.pipe(fs.createWriteStream("./dist/browser/blobtree.js"));

/*******************************************
 *  Minified build
 ******************************************/
// prepare browserify with debug options
var m = browserify(null, {
    'fullPaths' : true,
    'debug' : false,
    'standalone' : 'Blobtree'
});

// make three-full an extern dependency
m.external('THREE');
m.require('./src/blobtree.js', { expose: 'Blobtree' });
m.plugin(tinyify);

// build bundle
var bundleMinified = m.bundle().on('error', function(e) {
    console.error(e);
    throw e;
    process.exit(1);
});

// pipe bundle to output file
bundleMinified
    .pipe(fs.createWriteStream("./dist/browser/blobtree.min.js"));

