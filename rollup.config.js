import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'PluginFramework',
      sourcemap: true
    },
    {
      file: 'dist/bundle.min.js',
      format: 'iife',
      name: 'PluginFramework',
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ]
};
