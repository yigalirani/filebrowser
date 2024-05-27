import * as esbuild from 'esbuild'
import { Plugin, transform } from "esbuild"
import { readFile } from "fs/promises"

export const CSSMinifyPlugin: Plugin = {
    name: "CSSMinifyPlugin",
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const f = await readFile(args.path)
            const css = await transform(f, { loader: "css", minify: true })
            return { loader: "text", contents: css.code }
        })
    }
}
esbuild.build({ 
  entryPoints: ['src/filebrowser.ts'],
  platform: 'node',
  bundle: true,
  outdir: './dist',
  sourcemap: true,
  plugins:[
    CSSMinifyPlugin
  ],
  loader: { '.css': 'text' }
})
