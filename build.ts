import * as esbuild from 'esbuild'

esbuild.build({ 
  entryPoints: ['src/filebrowser.ts'],
  platform: 'node',
  bundle: true,
  outdir: './dist',
  sourcemap: true
})
