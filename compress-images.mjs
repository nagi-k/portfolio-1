import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const root = path.join(__dirname, 'public', 'images')

async function compressFile(file, maxWidth) {
  const tmp = file + '.tmp'
  const { width } = await sharp(file).metadata()
  const pipeline = sharp(file)
    .rotate()
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })

  if (width > maxWidth) {
    pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  }

  await pipeline.toFile(tmp)
  fs.renameSync(tmp, file)

  const after = fs.statSync(file).size
  console.log(`✓ ${path.relative(root, file)} → ${(after / 1024).toFixed(1)}KB`)
}

async function main() {
  const projectFiles = fs.readdirSync(path.join(root, 'projects'))
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => path.join(root, 'projects', f))

  const aboutFiles = fs.readdirSync(path.join(root, 'about'))
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => path.join(root, 'about', f))

  for (const file of projectFiles) {
    const isCover = file.includes('-cover')
    const maxWidth = isCover ? 1400 : 1600
    await compressFile(file, maxWidth)
  }

  for (const file of aboutFiles) {
    await compressFile(file, 900)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
