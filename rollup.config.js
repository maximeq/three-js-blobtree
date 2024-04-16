import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import del from 'rollup-plugin-delete'
import { dts } from "rollup-plugin-dts";

const PACKAGE_NAME = "three-js-blobtree"

export default [
    // bundle code
    {
        input: { 'module': "./src/exports.ts" },
        plugins: [
            del({ targets: 'dist/*' }),
            typescript(),
            commonjs(),
            nodeResolve(),
        ],
        external: [/node_modules/],
        output: [
            {
                dir: `./dist`,
                entryFileNames: `${PACKAGE_NAME}.[name].js`,
                chunkFileNames: `${PACKAGE_NAME}.internal.js`,
                format: "esm",
                sourcemap: true,
            },
        ],
    },

    // TODO: uncommented this when package is fully ported to TS
    // bundle types
    // {
    //     input: "./dist/types/exports.d.ts",
    //     output: [{ file: `dist/${PACKAGE_NAME}.module.d.ts`, format: "es" }],
    //     plugins: [dts()],
    // }
]
