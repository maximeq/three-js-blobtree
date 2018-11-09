
const jsdoc = require('jsdoc-api')

jsdoc.renderSync({ files: './src', destination:'./doc', recurse:true });