import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import del from 'rollup-plugin-delete'
import { dts } from "rollup-plugin-dts";
import { readFileSync } from 'fs';

const PACKAGE_NAME = "three-js-blobtree"
const PACKAGE_JSON = JSON.parse(readFileSync('package.json', 'utf8'))

const external = [
    ...Object.keys(PACKAGE_JSON.dependencies ?? {}),
    ...Object.keys(PACKAGE_JSON.peerDependencies ?? {})
]

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
        external: external,
        output: [
            {
                dir: `./dist`,
                entryFileNames: `${PACKAGE_NAME}.[name].js`,
                format: "esm",
                sourcemap: true,
            },
        ],
    },

    // bundle types
    {
        input: "./dist/types/exports.d.ts",
        output: [{ file: `dist/${PACKAGE_NAME}.module.d.ts`, format: "es" }],
        plugins: [dts()],
    }
]
