export const types: {
    [x: string]: {
        fromJSON: Function;
    };
};
/**
 *  Register a type in the list.
 *  @param {string} name The name of the type.
 *  @param {{fromJSON:Function}} cls The class of the registered type.
 */
export function register(name: string, cls: {
    fromJSON: Function;
}): void;
/**
 *  Register a type in the list.
 *  @param {string} name The name of the type.
 *  @param {{fromJSON:Function}} cls The class of the registered type.
 */
export function register(name: string, cls: {
    fromJSON: Function;
}): void;
/**
 *  Parse a JSON recursively to return a Blobtree or a blobtree element.
 *  @param {Object} json A javascript Object resulting from a JSON interpretation.
 *  @return {any}
 */
export function fromJSON(json: any): any;
/**
 *  Parse a JSON recursively to return a Blobtree or a blobtree element.
 *  @param {Object} json A javascript Object resulting from a JSON interpretation.
 *  @return {any}
 */
export function fromJSON(json: any): any;
//# sourceMappingURL=Types.d.ts.map