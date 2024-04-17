/**
 *  Keep track of all Types added to the Blobtree library.
 *  For now just a list of strings registered by the classes.
 */
export declare const Types: {
    /**
     * @type {Object<string,{fromJSON:Function}>}
     */
    types: {};
    /**
     *  Register a type in the list.
     *  @param {string} name The name of the type.
     *  @param {{fromJSON:Function}} cls The class of the registered type.
     */
    register(name: any, cls: any): void;
    /**
     *  Parse a JSON recursively to return a Blobtree or a blobtree element.
     *  @param {Object} json A javascript Object resulting from a JSON interpretation.
     *  @return {any}
     */
    fromJSON(json: any): any;
};
//# sourceMappingURL=Types.d.ts.map