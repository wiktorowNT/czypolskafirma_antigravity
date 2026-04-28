#!/usr/bin/env node
/**
 * fetch-logos.mjs
 * 
 * Pobiera logo firm z wielu źródeł API i zapisuje najlepszą wersję lokalnie.
 * Używa cascade: Google Favicon V2 → icon.horse → Favicone → DuckDuckGo
 * 
 * Użycie: node tools/fetch-logos.mjs [--force] [--domain=example.com]
 *   --force    Nadpisuje istniejące pliki logo
 *   --domain=  Pobiera logo tylko dla podanej domeny (debug)
 */

import { createClient } from '@supabase/supabase-js'
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const LOGOS_DIR = path.join(PROJECT_ROOT, 'public', 'logos')

// ── Config ──────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://bwciuhgrcibtjhhksjqk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTA3NjAsImV4cCI6MjA3NDU2Njc2MH0.FcT8xR_nED2Ev7hrQ5ATEIJ3XM1csOP43qz7VqQwxeQ'

const CONCURRENT_LIMIT = 3        // Max parallel downloads
const DELAY_BETWEEN_MS = 500      // Delay between batches
const REQUEST_TIMEOUT_MS = 10000  // 10s timeout per request
const MIN_VALID_SIZE = 200        // Minimum bytes for a valid logo

// Known bad icon fingerprints (Google's default globe etc.)
const KNOWN_BAD_SIZES = new Set([726]) // Google's default globe is exactly 726 bytes

// ── Helpers ─────────────────────────────────────────────────────────────

function getDomainFromUrl(url) {
  if (!url) return null
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(urlWithProtocol)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch a URL and return the response buffer, or null on failure.
 */
function fetchBuffer(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: timeoutMs,
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBuffer(res.headers.location, timeoutMs).then(resolve)
        return
      }

      if (res.statusCode !== 200) {
        res.resume()
        resolve(null)
        return
      }

      const contentType = res.headers['content-type'] || ''
      
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve({ buffer, contentType, size: buffer.length })
      })
      res.on('error', () => resolve(null))
    })

    req.on('error', () => resolve(null))
    req.on('timeout', () => {
      req.destroy()
      resolve(null)
    })
  })
}

/**
 * Check if a downloaded logo is valid (not a default globe, not too small, etc.)
 */
function isValidLogo(result) {
  if (!result || !result.buffer) return false
  if (result.size < MIN_VALID_SIZE) return false
  if (KNOWN_BAD_SIZES.has(result.size)) return false
  
  // Check content type - must be an image
  const ct = result.contentType.toLowerCase()
  if (!ct.includes('image') && !ct.includes('icon') && !ct.includes('svg')) return false
  
  return true
}

/**
 * Get file extension from content type
 */
function getExtension(contentType) {
  const ct = contentType.toLowerCase()
  if (ct.includes('svg')) return '.svg'
  if (ct.includes('png')) return '.png'
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg'
  if (ct.includes('webp')) return '.webp'
  if (ct.includes('icon') || ct.includes('x-icon')) return '.png' // We'll treat ico as png
  return '.png' // Default
}

// ── Logo Sources ────────────────────────────────────────────────────────

const LOGO_SOURCES = [
  {
    name: 'Google Favicon V2',
    getUrl: (domain) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`,
    priority: 1,
  },
  {
    name: 'icon.horse',
    getUrl: (domain) => `https://icon.horse/icon/${domain}`,
    priority: 2,
  },
  {
    name: 'Favicone',
    getUrl: (domain) => `https://favicone.com/${domain}?s=128`,
    priority: 3,
  },
  {
    name: 'DuckDuckGo',
    getUrl: (domain) => `https://external-content.duckduckgo.com/ip3/${domain}.ico`,
    priority: 4,
  },
  {
    name: 'Google s2',
    getUrl: (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    priority: 5,
  },
]

/**
 * Try all sources for a domain and return the best result.
 */
async function fetchBestLogo(domain) {
  const results = []

  for (const source of LOGO_SOURCES) {
    const url = source.getUrl(domain)
    try {
      const result = await fetchBuffer(url)
      if (isValidLogo(result)) {
        results.push({
          source: source.name,
          priority: source.priority,
          ...result,
        })
        // If we got a large enough logo from first source, skip the rest
        if (result.size > 2000 && source.priority <= 2) {
          break
        }
      }
    } catch (e) {
      // Skip failed source
    }
    // Small delay between sources
    await sleep(100)
  }

  if (results.length === 0) return null

  // Pick the best result: prefer larger files (higher resolution), tie-break by priority
  results.sort((a, b) => {
    // Prefer significantly larger files
    if (Math.abs(a.size - b.size) > 500) return b.size - a.size
    // Otherwise prefer higher priority source
    return a.priority - b.priority
  })

  return results[0]
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const domainArg = args.find(a => a.startsWith('--domain='))
  const singleDomain = domainArg ? domainArg.split('=')[1] : null

  // Ensure logos directory exists
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true })
  }

  console.log('🔍 Pobieranie listy firm z Supabase...')
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data: companies, error } = await supabase
    .from('companies')
    .select('slug, name, website_url')
    .order('name')

  if (error) {
    console.error('❌ Błąd Supabase:', error)
    process.exit(1)
  }

  console.log(`📋 Znaleziono ${companies.length} firm\n`)

  // Build domain list
  let domainsToFetch = []
  const domainToCompany = new Map()

  for (const company of companies) {
    const domain = getDomainFromUrl(company.website_url)
    if (!domain) {
      console.log(`⚠️  Brak URL: ${company.slug}`)
      continue
    }

    if (singleDomain && domain !== singleDomain) continue

    domainToCompany.set(domain, company)
    domainsToFetch.push(domain)
  }

  // Check which already exist (skip unless --force)
  if (!force) {
    const existing = []
    domainsToFetch = domainsToFetch.filter(domain => {
      // Check for any file with this domain name
      const files = fs.readdirSync(LOGOS_DIR)
      const hasFile = files.some(f => f.startsWith(domain + '.'))
      if (hasFile) {
        existing.push(domain)
        return false
      }
      return true
    })
    if (existing.length > 0) {
      console.log(`✅ Pominięto ${existing.length} firm z istniejącym logo (użyj --force by nadpisać)\n`)
    }
  }

  console.log(`🚀 Pobieranie logo dla ${domainsToFetch.length} firm...\n`)

  const stats = {
    success: 0,
    failed: 0,
    skipped: 0,
    sources: {},
    failedDomains: [],
  }

  // Process in batches
  for (let i = 0; i < domainsToFetch.length; i += CONCURRENT_LIMIT) {
    const batch = domainsToFetch.slice(i, i + CONCURRENT_LIMIT)
    
    const promises = batch.map(async (domain) => {
      const company = domainToCompany.get(domain)
      const result = await fetchBestLogo(domain)

      if (result) {
        const ext = getExtension(result.contentType)
        const filename = `${domain}${ext}`
        const filepath = path.join(LOGOS_DIR, filename)
        
        fs.writeFileSync(filepath, result.buffer)
        
        stats.success++
        stats.sources[result.source] = (stats.sources[result.source] || 0) + 1
        
        const sizeKb = (result.size / 1024).toFixed(1)
        console.log(`  ✅ ${company.slug.padEnd(30)} ${result.source.padEnd(20)} ${sizeKb}KB  → ${filename}`)
      } else {
        stats.failed++
        stats.failedDomains.push({ domain, slug: company.slug, name: company.name })
        console.log(`  ❌ ${company.slug.padEnd(30)} BRAK LOGO`)
      }
    })

    await Promise.all(promises)
    
    if (i + CONCURRENT_LIMIT < domainsToFetch.length) {
      await sleep(DELAY_BETWEEN_MS)
    }
  }

  // ── Report ──────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('📊 RAPORT POBIERANIA LOGO')
  console.log('═'.repeat(60))
  console.log(`  ✅ Pobrano:  ${stats.success}`)
  console.log(`  ❌ Brak:     ${stats.failed}`)
  console.log(`  ⏭️  Pominięto: ${stats.skipped}`)
  console.log()
  console.log('  Źródła:')
  for (const [source, count] of Object.entries(stats.sources).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${source}: ${count}`)
  }

  if (stats.failedDomains.length > 0) {
    console.log('\n  ❌ Firmy bez logo (wymagają ręcznego dodania):')
    for (const { slug, domain } of stats.failedDomains) {
      console.log(`    - ${slug} (${domain})`)
    }

    // Save failed list for manual processing
    const failedPath = path.join(PROJECT_ROOT, 'tools', 'missing-logos.json')
    fs.writeFileSync(failedPath, JSON.stringify(stats.failedDomains, null, 2))
    console.log(`\n  📄 Lista zapisana do: tools/missing-logos.json`)
  }

  console.log('\n' + '═'.repeat(60))
  
  // Count total logos now in /public/logos/
  const totalLogos = fs.readdirSync(LOGOS_DIR).filter(f => !f.startsWith('.')).length
  console.log(`📁 Łącznie plików w /public/logos/: ${totalLogos}`)
  console.log('═'.repeat(60))
}

main().catch(console.error)
