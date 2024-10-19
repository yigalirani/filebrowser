import * as esbuild from 'esbuild'
import {transform } from 'esbuild'
import { readFile } from 'fs/promises'

export const CSSMinifyPlugin = {
    name: 'CSSMinifyPlugin',
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const f = await readFile(args.path)
            const css = await transform(f, { loader: 'css', minify: true })
            return { loader: 'text', contents: css.code }
        })
    }
}
esbuild.build({ 
  entryPoints: ['src/filebrowser.ts'],
  platform: 'node',
  bundle: true,
  outdir: './dist',
  sourcemap: true,
  target: 'node10',
  minifySyntax:true, 
  plugins:[
    CSSMinifyPlugin
  ],
  loader: { '.css': 'text' }
})
