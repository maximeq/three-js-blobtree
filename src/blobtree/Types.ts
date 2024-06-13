import type { ElementJSON } from "./Element";

type Types = {
    types: {
        [key: string]: {
            fromJSON: Function
        }
    },
    register(name: string, cls: { fromJSON: Function }): void,
    fromJSON(json: ElementJSON): any
}
/**
 *  Keep track of all Types added to the Blobtree library.
 *  For now just a list of strings registered by the classes.
 */
export const Types: Types = {

    types: {},
    /**
     *  Register a type in the list.
     *  @param name The name of the type.
     *  @param cls The class of the registered type.
     */
    register(name: string, cls: { fromJSON: Function }): void {
        if (this.types[name]) {
            throw "Error : cannot register type " + name + ", this name is already registered.";
        }
        this.types[name] = cls;
    },
    /**
     *  Parse a JSON recursively to return a Blobtree or a blobtree element.
     *  @param json A javascript Object resulting from a JSON interpretation.
     */
    fromJSON(json: ElementJSON & {[key: string]: any}): any {
        const cls = this.types[json.type];
        if (!cls) {
            throw "Error : type found in JSON (" + json.type + " is not registered in the Blobtree library.";
        }
        return cls.fromJSON(json);
    }
}