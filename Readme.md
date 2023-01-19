## @rollup/plugin-commonjs dynamicRequireRoot issue reproduction

Issue found when using @rollup/plugin-commonjs with dynamicRequireTargets/dynamicRequireRoot and a symlinked app directory.

Outline of files in project:
```
/folder/my-app                 - contains the app to be compiled
/folder/my-app/my-app.js
/folder/my-app/package.json
/folder/my-app/node_modules

/build.sh
/package.json
/rollup.config.js
```

To build:
```sh
bash build.sj
```

During build, build.sh first creates a symlink `/my-app -> /folder/my-app`, then invokes rollup, which takes `/my-app/my-app.js` as the input file.


### Expected behaviour

The require root should be correctly identified as a valid parent of the compiled file(s).

Ideally this should occur regardless of whether the require root is expanded from its symlink form or not.


### Issue

#### 1. dynamicRequireRoot: 'my-app/node_modules'

If you set dynamicRequireRoot to the symlinked path, rollup produces this error:
```
[!] (plugin commonjs--resolver) RollupError: "/Users/ben/Desktop/rollup-plugin-commonjs-dynamicrequireroot-symlink-issue/folder/my-app/node_modules/sequelize/lib/dialects/abstract/connection-manager.js" contains dynamic require statements but it is not within the current dynamicRequireRoot "/Users/ben/Desktop/rollup-plugin-commonjs-dynamicrequireroot-symlink-issue/my-app/node_modules". You should set dynamicRequireRoot to "/Users/ben/Desktop/rollup-plugin-commonjs-dynamicrequireroot-symlink-issue/folder/my-app/node_modules/sequelize/lib/dialects/abstract" or one of its parent directories.
```

It is saying that the file's path is `folder/my-app/node_modules/sequelize/lib/dialects/abstract/connection-manager.js`.path

It suggests setting the require root to `folder/my-app/node_modules` instead, as this would be a valid parent of the file path as stated.

#### 2. dynamicRequireRoot: realpathSync('my-app') + '/node_modules'

If you instead set dynamicRequireRoot to the full path, i.e. expanding the symlink, the inverse error is produced:

```
[!] (plugin commonjs) RollupError: "/Users/ben/Desktop/rollup-plugin-commonjs-dynamicrequireroot-symlink-issue/my-app/node_modules/sequelize/lib/dialects/abstract/connection-manager.js" contains dynamic require statements but it is not within the current dynamicRequireRoot "/Users/ben/Desktop/rollup-plugin-commonjs-dynamicrequireroot-symlink-issue/folder/my-app/node_modules". You should set dynamicRequireRoot to "/Users/ben/Desktop/rollup-plugin-commonjs-dynamicrequireroot-symlink-issue/my-app/node_modules/sequelize/lib/dialects/abstract" or one of its parent directories.
```

i.e. it is now stating the file path as `my-app/node_modules/sequelize/lib/dialects/abstract/connection-manager.js`.

Rollup now makes the opposite complaint, i.e. that `folder/my-app/node_modules` is not a parent of `my-app/node_modules/.../<file>.js`

To summarise: It's a catch-22:

- dynamicRequireRoot non-expanded: rollup says '<non-expanded require root path> is not a parent of <expanded file path>'.
- dynamicRequireRoot expanded: rollup says: '<expanded require root path> is not a parent of <non-expanded file path>'.

i.e.: curiously, when dynamicRequireRoot changes between expanded/non-expanded, the file path is considered non-expanded/expanded (i.e. the opposite) which seems to creates a conflict whatever you do.
