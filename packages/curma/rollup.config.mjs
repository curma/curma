// typescript support
import typescript from '@rollup/plugin-typescript';
import {defineConfig} from 'rollup';

// cli project
export default defineConfig({
  input: 'src/**/*.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json'
    })
  ]
})