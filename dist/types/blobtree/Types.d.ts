type Types = {
    types: {
        [key: string]: {
            fromJSON: Function;
        };
    };
    register(name: string, cls: {
        fromJSON: Function;
    }): void;
    fromJSON(json: {
        type: string;
        [key: string]: any;
    }): any;
};
/**
 *  Keep track of all Types added to the Blobtree library.
 *  For now just a list of strings registered by the classes.
 */
export declare const Types: Types;
export {};
//# sourceMappingURL=Types.d.ts.map