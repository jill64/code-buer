import { build } from 'esbuild'

build({
  entryPoints: ['action/src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: ''
})
