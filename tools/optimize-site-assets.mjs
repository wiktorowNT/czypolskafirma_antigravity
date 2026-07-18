// Jednorazowa optymalizacja assetów serwisu (NIE logotypów firm — te
// zostają w pełnej jakości). Zmniejsza pliki, które były wielokrotnie
// większe niż rozmiar, w jakim są wyświetlane:
//   - public/logo.png  (nagłówek, ~32 px wysokości) -> wysokość 256 px
//   - public/icon.png  (favicon/apple-icon)         -> szerokość 512 px
//   - public/og-image.png (podgląd przy udostępnianiu) -> szerokość 1200 px
// Oryginały pozostają w historii gita.
// Użycie: node tools/optimize-site-assets.mjs
import sharp from "sharp"
import fs from "fs"

const jobs = [
  { file: "public/logo.png", resize: { height: 256 } },
  { file: "public/icon.png", resize: { width: 512 } },
  { file: "public/og-image.png", resize: { width: 1200 } },
]

for (const { file, resize } of jobs) {
  const before = fs.statSync(file).size
  const buf = await sharp(file)
    .resize({ ...resize, withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
  fs.writeFileSync(file, buf)
  const meta = await sharp(buf).metadata()
  console.log(
    `${file}: ${(before / 1024).toFixed(0)} KB -> ${(buf.length / 1024).toFixed(0)} KB (${meta.width}x${meta.height})`,
  )
}
