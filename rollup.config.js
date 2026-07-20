import babel from "rollup-plugin-babel"
import resolve from "@rollup/plugin-node-resolve"
import external from "rollup-plugin-peer-deps-external"
// import postcss from "rollup-plugin-postcss"
import {terser} from "rollup-plugin-terser"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import dts from "rollup-plugin-dts"
const packageJson = require("./package.json")

export default [
    {
        input: "./src/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: true,
            },
            {
                file: packageJson.module,
                format: "esm",
                // exports: "named",
                sourcemap: true,
            }
        ],
        plugins: [
            // postcss({
            //     plugins: [],
            //     minimize: true
            // }),
            babel({
                exclude: "node_modules/**",
                presets: ["@babel/preset-react"],
            }),
            external(),
            resolve(),
            terser(),
            commonjs(),
            typescript({tsconfig: "./tsconfig.json"})
        ],
        external: ["react", "react-dom"]
    },
    {
        input: "src/index.ts",
        output: [{file: packageJson.types}],
        plugins: [dts()],
        external: [/\.css/]
    }
]