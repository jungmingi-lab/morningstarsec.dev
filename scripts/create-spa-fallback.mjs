import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const indexPath = resolve('dist/index.html')
const fallbackPath = resolve('dist/404.html')

if (!existsSync(indexPath)) {
  throw new Error('dist/index.html was not found. Run vite build first.')
}

copyFileSync(indexPath, fallbackPath)
console.log('Created dist/404.html for GitHub Pages SPA routing.')
