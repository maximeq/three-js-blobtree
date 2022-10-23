"use strict";

/**
 *  Keep track of all Types added to the Blobtree library.
 *  For now just a list of strings registered by the classes.
 */
var Types = {
    /**
     * @type {Object<string,{fromJSON:Function}>}
     */
    types: {},
    /**
     *  Register a type in the list.
     *  @param {string} name The name of the type.
     *  @param {{fromJSON:Function}} cls The class of the registered type.
     */
    register(name, cls) {
        if (this.types[name]) {
            throw "Error : cannot register type " + name + ", this name is already registered.";
        }
        this.types[name] = cls;
    },
    /**
     *  Parse a JSON recursively to return a Blobtree or a blobtree element.
     *  @param {Object} json A javascript Object resulting from a JSON interpretation.
     *  @return {any}
     */
    fromJSON(json) {
        var cls = this.types[json.type];
        if (!cls) {
            throw "Error : type found in JSON (" + json.type + " is not registered in the Blobtree library.";
        }
        return cls.fromJSON(json);
    }
}

module.exports = Types;
