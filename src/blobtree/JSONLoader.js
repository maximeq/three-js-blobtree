'use strict';

const Element = require("./Element.js");
const Types = require("./Types.js");

/**
 *  Load a Blobtree as JSON. Deprecated, please use Types.fromJSON now.
 *  @deprecated
 */
var JSONLoader = function() {
    console.warn("JSON Loader is deprecated, please use Types.fromJSON(json).")
};

JSONLoader.prototype.constructor = JSONLoader;

JSONLoader.prototype.parse = function(json){
    return Types.fromJSON(json);
};

module.exports = JSONLoader;




