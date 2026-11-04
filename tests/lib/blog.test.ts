import fs from "node:fs"
import path from "node:path"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// lib/blog.ts ustala katalog wpisów (process.cwd()/content/blog) w chwili importu.
// Dlatego moduł importujemy dynamicznie: raz z cwd podmienionym na tests/fixtures
// (atrapa z przewidywalnymi wpisami), raz z prawdziwym cwd (kontrola treści repo).
type ModulBlog = typeof import("@/lib/blog")

const KATALOG_ATRAPY = path.resolve(__dirname, "../fixtures")
const KATALOG_REPO = path.resolve(__dirname, "../..")

async function zaladujBlog(cwd: string): Promise<ModulBlog> {
  const spy = vi.spyOn(process, "cwd").mockReturnValue(cwd)
  vi.resetModules()
  try {
    return await import("@/lib/blog")
  } finally {
    spy.mockRestore()
  }
}

/** Ustawia „dziś” na podany moment (wpisy z przyszłą datą są ukryte). */
function ustawTeraz(iso: string) {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date(iso))
}

const slugi = (wpisy: { slug: string }[]) => wpisy.map((w) => w.slug)

describe("blog na atrapie (tests/fixtures/content/blog)", () => {
  let blog: ModulBlog

  beforeAll(async () => {
    blog = await zaladujBlog(KATALOG_ATRAPY)
  })

  beforeEach(() => {
    vi.stubEnv("VERCEL_ENV", "production")
    // 4 listopada 2026, południe w Polsce.
    ustawTeraz("2026-11-04T11:00:00Z")
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("getAllPosts", () => {
    it("pomija _szablon, pliki inne niż .md, wpisy bez daty i zaplanowane; sortuje od najnowszego", () => {
      expect(slugi(blog.getAllPosts())).toEqual(["d-ogolny", "a-zabka", "b-biedronka", "c-biedronka-lidl", "lomza-nowosci"])
    })

    it("slug z nazwy pliku, gdy frontmatter go nie podaje; slug i firmy przez slugify", () => {
      const wpisy = blog.getAllPosts()
      expect(wpisy.find((w) => w.title === "Wpis o Biedronce i Żabce")?.slug).toBe("b-biedronka")
      const lomza = wpisy.find((w) => w.slug === "lomza-nowosci")!
      // "Łomża" -> "lomza", a liczba 123 z frontmattera jest odrzucona.
      expect(lomza.relatedCompanies).toEqual(["lomza"])
      expect(lomza.date).toBe("2026-07-01")
      expect(wpisy.find((w) => w.slug === "a-zabka")?.relatedCompanies).toEqual(["zabka", "dr-max"])
    })

    it("wpis zaplanowany pojawia się o północy czasu polskiego, nie UTC", () => {
      // 23:30 UTC 4 listopada to już 00:30 5 listopada w Warszawie.
      ustawTeraz("2026-11-04T23:30:00Z")
      expect(slugi(blog.getAllPosts())[0]).toBe("e-zaplanowany")
      // 22:30 UTC to jeszcze 23:30 4 listopada w Warszawie.
      ustawTeraz("2026-11-04T22:30:00Z")
      expect(slugi(blog.getAllPosts())).not.toContain("e-zaplanowany")
    })

    it("podgląd Vercel (VERCEL_ENV=preview) pokazuje też wpisy zaplanowane", () => {
      vi.stubEnv("VERCEL_ENV", "preview")
      expect(slugi(blog.getAllPosts())[0]).toBe("e-zaplanowany")
    })
  })

  describe("getPostsForCompany", () => {
    it("zwraca wpisy, które wymieniają firmę, od najnowszego", () => {
      expect(slugi(blog.getPostsForCompany("zabka"))).toEqual(["a-zabka", "b-biedronka", "c-biedronka-lidl"])
      expect(slugi(blog.getPostsForCompany("lidl"))).toEqual(["c-biedronka-lidl"])
    })

    it("przyjmuje surowy slug albo nazwę i normalizuje ją przez slugify", () => {
      expect(slugi(blog.getPostsForCompany("Żabka"))).toEqual(["a-zabka", "b-biedronka", "c-biedronka-lidl"])
      expect(slugi(blog.getPostsForCompany("Dr. Max"))).toEqual(["a-zabka"])
      expect(slugi(blog.getPostsForCompany("ŁOMŻA"))).toEqual(["lomza-nowosci"])
    })

    it("respektuje limit (domyślnie 4)", () => {
      expect(slugi(blog.getPostsForCompany("zabka", 2))).toEqual(["a-zabka", "b-biedronka"])
      vi.stubEnv("VERCEL_ENV", "preview")
      // Na podglądzie żabka ma 4 wpisy (z zaplanowanym), więc domyślny limit nic nie ucina.
      expect(blog.getPostsForCompany("zabka")).toHaveLength(4)
    })

    it("nie pokazuje wpisów zaplanowanych ani szablonu", () => {
      const wynik = slugi(blog.getPostsForCompany("zabka", 100))
      expect(wynik).not.toContain("e-zaplanowany")
      expect(wynik).not.toContain("szablon")
    })

    it("pusty slug i firma bez wpisów dają pustą listę", () => {
      expect(blog.getPostsForCompany("")).toEqual([])
      expect(blog.getPostsForCompany("---")).toEqual([])
      expect(blog.getPostsForCompany("orlen")).toEqual([])
    })
  })

  describe("getRelatedPosts", () => {
    const wpis = (slug: string) => blog.getAllPosts().find((w) => w.slug === slug)!

    it("najpierw wpisy o tych samych firmach, przy remisie nowsze", () => {
      // a-zabka: [zabka, dr-max]. b i c mają po 1 wspólnej firmie, b jest nowszy.
      expect(slugi(blog.getRelatedPosts(wpis("a-zabka")))).toEqual(["b-biedronka", "c-biedronka-lidl"])
    })

    it("więcej wspólnych firm = wyżej, nawet gdy wpis jest starszy", () => {
      // c: [biedronka, lidl, zabka]. b ma 2 wspólne, a tylko 1, d i lomza 0.
      expect(slugi(blog.getRelatedPosts(wpis("c-biedronka-lidl"), 4))).toEqual([
        "b-biedronka",
        "a-zabka",
        "d-ogolny",
        "lomza-nowosci",
      ])
    })

    it("wpis bez firm dostaje po prostu najnowsze wpisy", () => {
      expect(slugi(blog.getRelatedPosts(wpis("d-ogolny"), 3))).toEqual(["a-zabka", "b-biedronka", "c-biedronka-lidl"])
    })

    it("nigdy nie poleca samego siebie i respektuje limit (domyślnie 2)", () => {
      for (const w of blog.getAllPosts()) {
        const polecane = blog.getRelatedPosts(w)
        expect(polecane).toHaveLength(2)
        expect(slugi(polecane)).not.toContain(w.slug)
        expect(slugi(blog.getRelatedPosts(w, 100))).toHaveLength(blog.getAllPosts().length - 1)
      }
    })

    it("nie poleca wpisów zaplanowanych", () => {
      expect(slugi(blog.getRelatedPosts(wpis("a-zabka"), 100))).not.toContain("e-zaplanowany")
    })
  })
})

describe("blog na prawdziwych plikach content/blog", () => {
  let blog: ModulBlog
  const plikiWpisow = fs
    .readdirSync(path.join(KATALOG_REPO, "content", "blog"))
    .filter((f) => f.toLowerCase().endsWith(".md") && !f.startsWith("_"))

  beforeAll(async () => {
    blog = await zaladujBlog(KATALOG_REPO)
  })

  beforeEach(() => {
    // Podgląd pokazuje też wpisy zaplanowane, więc liczymy wszystkie pliki.
    vi.stubEnv("VERCEL_ENV", "preview")
  })

  it("każdy plik .md daje wpis (parser nie gubi po cichu wpisu z błędnym frontmatterem)", () => {
    expect(plikiWpisow.length).toBeGreaterThan(0)
    expect(blog.getAllPosts()).toHaveLength(plikiWpisow.length)
  })

  it("slugi wpisów są unikalne", () => {
    const wszystkie = slugi(blog.getAllPosts())
    expect(new Set(wszystkie).size).toBe(wszystkie.length)
  })

  it("każdy wpis wymieniający firmę wraca w getPostsForCompany tej firmy", () => {
    for (const w of blog.getAllPosts()) {
      for (const firma of w.relatedCompanies) {
        expect(slugi(blog.getPostsForCompany(firma, Infinity))).toContain(w.slug)
      }
    }
  })

  it("getRelatedPosts dla prawdziwych wpisów nie zwraca samego wpisu", () => {
    for (const w of blog.getAllPosts()) {
      expect(slugi(blog.getRelatedPosts(w))).not.toContain(w.slug)
    }
  })
})
