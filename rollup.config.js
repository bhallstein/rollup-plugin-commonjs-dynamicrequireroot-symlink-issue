import {builtinModules as builtins} from 'node:module'
import {realpathSync} from 'node:fs'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'

function is_external(mod) {   // Prevent unresolved dep warnings for built-in
  return (                    // node modules
    builtins.includes(mod) ||
    mod.match(/^node:/)
  )
}

const RollupConfig = {
  input: 'my-app/my-app.js',  // my-app/ is a symlink to ./folder/my-app
  output: {
    file: 'dist/my-app.js',
    format: 'es',
    name: 'my-app',
  },
  plugins: [
    resolve({
      preferBuiltins: false,
    }),
    commonjs({
      include: /node_modules/,
      dynamicRequireTargets: [
        '**/node_modules/sequelize/**/*.js',
      ],
      dynamicRequireRoot: realpathSync('my-app') + '/node_modules',
      // dynamicRequireRoot: 'my-app/node_modules',
      transformMixedEsModules: true,
    }),
    json(),
  ],
  external: is_external,
}

export default RollupConfig
