import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import alias from "@rollup/plugin-alias";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/bundle.js",
      format: "iife",
      name: "PluginFramework",
      sourcemap: true,
    },
    {
      file: "dist/bundle.min.js",
      format: "iife",
      name: "PluginFramework",
      plugins: [terser()],
      sourcemap: true,
    },
  ],
  plugins: [
    alias({
      entries: [
        { find: "@", replacement: path.resolve(__dirname, "src") },
        { find: "@/plugin", replacement: path.resolve(__dirname, "src/plugin") },
        { find: "@/util", replacement: path.resolve(__dirname, "src/util") },
        { find: "@/composable", replacement: path.resolve(__dirname, "src/composable") },
      ],
    }),
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
};
