// PNG install icons rendered from the SVG sources
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const targets = [
  ['app-icon.svg', 192, 'icon-192.png'],
  ['app-icon.svg', 512, 'icon-512.png'],
  ['app-icon-maskable.svg', 512, 'maskable-512.png'],
  ['app-icon-maskable.svg', 180, 'apple-touch-icon.png'],
]

await mkdir('public/icons', { recursive: true })

for (const [source, size, name] of targets) {
  await sharp(`public/branding/${source}`, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/${name}`)
}
