#!/usr/bin/env node
/**
 * cleanup-logos.mjs
 *
 * Skanuje katalog public/logos/ i wykrywa duplikaty — pliki z tą samą domeną
 * ale różnym rozszerzeniem (np. amica.pl.jpg + amica.pl.svg).
 *
 * Hierarchia jakości: SVG > PNG > WEBP > JPG > JPEG > GIF
 * Przy tej samej rozszerzalności zachowuje większy plik.
 *
 * Użycie:
 *   node tools/cleanup-logos.mjs              # tryb dry-run (tylko raport)
 *   node tools/cleanup-logos.mjs --execute    # faktycznie usuwa gorsze duplikaty
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ── Ścieżki ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos')

// ── Konfiguracja ────────────────────────────────────────────────────────

// Hierarchia formatów — im niższy indeks, tym lepsza jakość
const FORMAT_PRIORITY = ['svg', 'png', 'webp', 'jpg', 'jpeg', 'gif']

// Flagi z linii poleceń
const args = process.argv.slice(2)
const EXECUTE = args.includes('--execute')

// ── Pomocnicze funkcje ──────────────────────────────────────────────────

/**
 * Wyciąga domenę z nazwy pliku logo.
 * np. "amica.pl.svg" → "amica.pl", "amica.pl.jpg" → "amica.pl"
 */
function extractDomain(filename) {
  const knownExtensions = /\.(svg|png|webp|jpg|jpeg|gif)$/i
  return filename.replace(knownExtensions, '')
}

/**
 * Wyciąga rozszerzenie pliku (bez kropki, lowercase).
 */
function getExtension(filename) {
  const match = filename.match(/\.(svg|png|webp|jpg|jpeg|gif)$/i)
  return match ? match[1].toLowerCase() : null
}

/**
 * Zwraca priorytet formatu (niższy = lepszy).
 * SVG=0, PNG=1, WEBP=2, JPG=3, JPEG=4, GIF=5
 */
function getFormatPriority(ext) {
  const idx = FORMAT_PRIORITY.indexOf(ext.toLowerCase())
  return idx === -1 ? 999 : idx
}

/**
 * Formatuje rozmiar pliku w czytelny sposób.
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ── Główna logika ───────────────────────────────────────────────────────

function main() {
  console.log(`\n🔍 Skanowanie ${LOGOS_DIR}...\n`)

  // Sprawdź czy katalog istnieje
  if (!fs.existsSync(LOGOS_DIR)) {
    console.error('❌ Katalog public/logos/ nie istnieje!')
    process.exit(1)
  }

  // Wczytaj wszystkie pliki logo
  const allFiles = fs.readdirSync(LOGOS_DIR).filter(f => {
    const ext = getExtension(f)
    return ext !== null
  })

  console.log(`📁 Znaleziono ${allFiles.length} plików logo\n`)

  // Grupuj pliki wg domeny
  const domainMap = new Map()

  for (const filename of allFiles) {
    const domain = extractDomain(filename)
    if (!domainMap.has(domain)) {
      domainMap.set(domain, [])
    }
    domainMap.get(domain).push(filename)
  }

  // Znajdź domeny z duplikatami (więcej niż 1 plik)
  const duplicates = [...domainMap.entries()]
    .filter(([, files]) => files.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))

  if (duplicates.length === 0) {
    console.log('✅ Brak duplikatów — wszystko czyste!')
    return
  }

  console.log(`📋 Znaleziono ${duplicates.length} domen z duplikatami:\n`)

  // Zbieramy statystyki
  let totalToRemove = 0
  let totalBytesToFree = 0
  const filesToRemove = []

  for (const [domain, files] of duplicates) {
    // Pobierz informacje o każdym pliku
    const fileInfos = files.map(filename => {
      const filePath = path.join(LOGOS_DIR, filename)
      let size = 0
      try {
        const stat = fs.statSync(filePath)
        size = stat.size
      } catch {
        // Plik może nie mieć rozmiaru (np. pusty)
        size = 0
      }
      const ext = getExtension(filename)
      return {
        filename,
        filePath,
        ext,
        size,
        priority: getFormatPriority(ext),
      }
    })

    // Sortuj: puste pliki zawsze na koniec, potem lepszy format, potem większy plik
    fileInfos.sort((a, b) => {
      // Puste pliki (0 B) zawsze gorsze — niezależnie od formatu
      if (a.size === 0 && b.size > 0) return 1
      if (b.size === 0 && a.size > 0) return -1
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.size - a.size // Większy plik = lepszy
    })

    // Pierwszy = najlepszy (zachowujemy), reszta = do usunięcia
    const best = fileInfos[0]
    const worse = fileInfos.slice(1)

    // Buduj linię raportu
    const parts = fileInfos.map(f => {
      if (f === best) {
        return `${f.filename} (${formatSize(f.size)}) ✅ zachowam`
      } else {
        return `${f.filename} (${formatSize(f.size)}) ← usunę`
      }
    })

    console.log(`  ${domain}: ${parts.join(' | ')}`)

    for (const w of worse) {
      filesToRemove.push(w)
      totalToRemove++
      totalBytesToFree += w.size
    }
  }

  // ── Raport końcowy ──────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════')
  console.log('📊 RAPORT')
  console.log(`  Domeny z duplikatami: ${duplicates.length}`)
  console.log(`  Do usunięcia: ${totalToRemove} plików (${formatSize(totalBytesToFree)})`)

  if (EXECUTE) {
    // Faktyczne usuwanie plików
    console.log('\n🗑️  Usuwanie plików...\n')
    let removedCount = 0
    let removedBytes = 0

    for (const file of filesToRemove) {
      try {
        fs.unlinkSync(file.filePath)
        removedCount++
        removedBytes += file.size
        console.log(`  ✅ Usunięto: ${file.filename}`)
      } catch (err) {
        console.error(`  ❌ Błąd przy usuwaniu ${file.filename}: ${err.message}`)
      }
    }

    console.log('\n═══════════════════════════════════════')
    console.log('🏁 GOTOWE')
    console.log(`  Usunięto: ${removedCount} plików`)
    console.log(`  Odzyskano: ${formatSize(removedBytes)}`)
    console.log('═══════════════════════════════════════\n')
  } else {
    console.log('\n  ⚠️  Tryb dry-run — żaden plik nie został usunięty.')
    console.log('  Użyj --execute aby faktycznie usunąć duplikaty.')
    console.log('═══════════════════════════════════════\n')
  }
}

// ── Start ───────────────────────────────────────────────────────────────
main()
