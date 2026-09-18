#!/usr/bin/env node
// Automat dodawania firm: z listy nazw (albo kategorii) robi szkice rekordów do zatwierdzenia.
// Nic nie zapisuje do Supabase. Wynik: data/robocze/automat/partia-<nazwa>.json
//
// Użycie:
//   node tools/firmy/automat.mjs --firmy "Mokate, Wedel, Inea"
//   node tools/firmy/automat.mjs --plik lista.txt                 (jedna nazwa na linię)
//   node tools/firmy/automat.mjs --kategoria kosmetyki --seed 40  (model proponuje listę)
//   node tools/firmy/automat.mjs --partia 2026-09-17-test          (kontynuuje istniejącą partię)
// Opcje:
//   --partia NAZWA        nazwa partii (domyślnie data)
//   --rownolegle N        ile firm naraz (domyślnie 2)
//   --model-sledztwo M    sonnet|opus|haiku (domyślnie sonnet); --model-kontrola, --model-opisy analogicznie
//   --reweryfikacja       firmy już w bazie: porównaj nowe ustalenia z obecnym rekordem
//   --reczny              zamiast wołać claude, zapisz prompty do plików i czytaj odpowiedzi z plików
//   --bez-gieldy          pomiń pobieranie akcjonariatu z bankier.pl
//   --crbr                dołącz beneficjentów rzeczywistych z CRBR (puppeteer, wolniejsze; tylko dane zagregowane)
//   --tylko-rejestry      wykonaj tylko kroki bez modelu (tożsamość z podanego NIP-u, KRS, giełda)
//   --nip-model M         kto szuka NIP-u w kroku 1: claude (domyślnie) albo gemini (Gemini CLI na
//                         koncie Google); wybór zapamiętuje się w partii
//   --stop-po-nip         zatrzymaj się po kroku 1 i 2 (NIP, KRS) do potwierdzenia; kolejne
//                         uruchomienie z tą samą --partia rusza dalej (używa tego panel)
//   --przelicz            przelicz pewność i rekordy już gotowych firm (po zmianie reguł), bez wołania modelu
import fs from "node:fs";
import path from "node:path";
import { KATALOG_PARTII, dzisiaj } from "./lib/env.mjs";
import { MODELE, sprawdzLogowanie, zapytajModel } from "./lib/claude.mjs";
import { stanLogowaniaGemini, zapytajGemini } from "./lib/gemini.mjs";
import { bankierAkcjonariat, krsHistoriaWlascicieli, krsOdpisAktualny, mfPoNipach } from "./lib/rejestry.mjs";
import { crbrBeneficjenci } from "./lib/crbr.mjs";
import { indeksFirm, kategorie as pobierzKategorie } from "./lib/supabase.mjs";
import { czyNip, normalizujKrs, normalizujNip, podobienstwoNazw, slugify } from "./lib/tekst.mjs";
import { normalizujKrajOdModelu } from "./lib/walidacja.mjs";
import { zlozRekord } from "./lib/rekord.mjs";
import { SCHEMAT_KONTROLA, SCHEMAT_OPISY, SCHEMAT_SEED, SCHEMAT_SLEDZTWO, SCHEMAT_TOZSAMOSC, promptKontrola, promptOpisy, promptSeed, promptSledztwo, promptTozsamosc } from "./lib/prompty.mjs";

// ---------- argumenty ----------
const arg = parsujArgs(process.argv.slice(2));
if (arg.help || (!arg.firmy && !arg.plik && !arg.kategoria && !arg.partia)) {
  console.log(fs.readFileSync(new URL(import.meta.url)).toString().split("\n").slice(1, 20).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(0);
}
const NAZWA_PARTII = arg.partia || `${dzisiaj()}${arg.kategoria ? "-" + slugify(arg.kategoria) : ""}`;
const PLIK_PARTII = path.join(KATALOG_PARTII, `partia-${NAZWA_PARTII}.json`);
const ROWNOLEGLE = Math.max(1, Number(arg.rownolegle) || 2);
const OPCJE_MODELU = { reczny: !!arg.reczny, katalogPartii: KATALOG_PARTII, partia: NAZWA_PARTII };
const MODEL = {
  seed: MODELE[arg["model-seed"]] || arg["model-seed"] || MODELE.tani,
  // Krok 1 to wyszukanie numeru, który i tak weryfikują rejestry — tańszy model wystarcza.
  // Gdy rejestry go nie potwierdzą, automat powtarza krok mocniejszym modelem (niżej).
  tozsamosc: MODELE[arg["model-tozsamosc"]] || arg["model-tozsamosc"] || MODELE.tani,
  sledztwo: MODELE[arg["model-sledztwo"]] || arg["model-sledztwo"] || MODELE.sredni,
  kontrola: MODELE[arg["model-kontrola"]] || arg["model-kontrola"] || MODELE.sredni,
  opisy: MODELE[arg["model-opisy"]] || arg["model-opisy"] || MODELE.sredni,
};

function parsujArgs(a) {
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith("--")) {
      const k = a[i].slice(2);
      const v = a[i + 1] && !a[i + 1].startsWith("--") ? a[++i] : true;
      o[k] = v;
    }
  }
  return o;
}

function log(...s) {
  console.log(`[${new Date().toTimeString().slice(0, 8)}]`, ...s);
}

// ---------- partia: wczytaj / utwórz ----------
fs.mkdirSync(KATALOG_PARTII, { recursive: true });
let partia = fs.existsSync(PLIK_PARTII)
  ? JSON.parse(fs.readFileSync(PLIK_PARTII, "utf8"))
  : { nazwa: NAZWA_PARTII, utworzono: new Date().toISOString(), tryb: arg.reweryfikacja ? "reweryfikacja" : "nowe", firmy: [], statystyki: { wywolan: 0, sekundy: 0, tokenyWe: 0, tokenyWy: 0, wyszukiwan: 0 } };
if (arg.reweryfikacja) partia.tryb = "reweryfikacja";
// Kto szuka NIP-u: wybór z pierwszego uruchomienia obowiązuje też przy wznowieniach partii.
if (arg["nip-model"]) partia.nipModel = String(arg["nip-model"]).toLowerCase() === "gemini" ? "gemini" : "claude";
const NIP_GEMINI = partia.nipModel === "gemini";

function zapiszPartie() {
  partia.zaktualizowano = new Date().toISOString();
  fs.writeFileSync(PLIK_PARTII, JSON.stringify(partia, null, 2), "utf8");
}

function dodajFirme(nazwa, dodatkowe = {}) {
  const n = String(nazwa || "").trim();
  if (!n) return;
  if (partia.firmy.some((f) => f.nazwa.toLowerCase() === n.toLowerCase())) return;
  partia.firmy.push({ nazwa: n, plik: slugify(n) || `firma-${partia.firmy.length + 1}`, tryb: partia.tryb, etapy: {}, ...dodatkowe });
}

// wejście: --firmy / --plik (linie "Nazwa" albo "Nazwa | NIP")
if (arg.firmy) for (const n of String(arg.firmy).split(/[,;\n]/)) dodajFirme(n);
if (arg.plik) {
  for (const linia of fs.readFileSync(arg.plik, "utf8").split(/\r?\n/)) {
    const l = linia.trim();
    if (!l || l.startsWith("#")) continue;
    const [n, nip] = l.split("|").map((x) => x.trim());
    dodajFirme(n, nip ? { nipPodany: normalizujNip(nip) } : {});
  }
}

// Plik partii zapisujemy od razu po wczytaniu wejścia, żeby panel miał co pokazać,
// zanim skończy się pierwsza firma (krok 1 trwa do dwóch minut).
if (partia.firmy.length) zapiszPartie();

// ---------- główny przebieg ----------
const DZIS = dzisiaj();
const kategorie = await pobierzKategorie();
const indeks = await indeksFirm();
log(`baza: ${indeks.length} firm, ${kategorie.length} kategorii; partia "${NAZWA_PARTII}"`);

if (NIP_GEMINI && !arg.reczny && !arg["tylko-rejestry"]) {
  const g = stanLogowaniaGemini();
  if (!g.zalogowany) {
    console.error(`\nNIP-y ma szukać Gemini, ale: ${g.powod}. Wybierz Claude (w panelu: "Kto szuka numerów NIP") albo sprawdź lampkę Gemini na ekranie "Gotowość".\n`);
    process.exit(2);
  }
}
if (!arg.reczny && !arg["tylko-rejestry"]) {
  const lg = await sprawdzLogowanie();
  if (!lg.zalogowany) {
    console.error(`\nClaude Code nie jest zalogowane (${lg.powod || lg.metoda || "brak sesji"}).\nZaloguj się raz w terminalu: claude auth login\nalbo wpisz do .env.local token z "claude setup-token" jako CLAUDE_CODE_OAUTH_TOKEN=...\nAlternatywa bez logowania: dodaj --reczny (prompty do plików).\n`);
    process.exit(2);
  }
}

// krok 0: seed
if (arg.kategoria && !partia.seedZrobiony) {
  const kat = kategorie.find((k) => k.slug === slugify(arg.kategoria) || k.name.toLowerCase() === String(arg.kategoria).toLowerCase());
  const juz = indeks.filter((f) => !kat || f.category_id === kat.id).map((f) => f.display_name || f.name || f.slug);
  const r = await zapytajModel({ nazwaKroku: "seed", prompt: promptSeed({ kategoria: kat?.name || arg.kategoria, ile: Number(arg.seed) || 40, juzWBazie: juz }), model: MODEL.seed, schemat: SCHEMAT_SEED, narzedzia: [], opcje: { ...OPCJE_MODELU, plikFirmy: "seed" } });
  if (r.czeka) {
    log(`tryb ręczny: prompt seed w ${r.prompt}; zapisz odpowiedź jako ${r.czeka} i uruchom ponownie`);
    zapiszPartie();
    process.exit(0);
  }
  if (r.blad) {
    console.error("seed:", r.blad);
    process.exit(1);
  }
  for (const f of r.dane.firmy || []) dodajFirme(f.nazwa, { uzasadnienieSeed: f.uzasadnienie, kategoriaSeed: kat?.slug || null });
  partia.seedZrobiony = true;
  zliczStat(r.meta);
  zapiszPartie();
  log(`seed: ${r.dane.firmy?.length || 0} propozycji, w partii ${partia.firmy.length} firm`);
}

function zliczStat(meta) {
  if (!meta || meta.model === "reczny") return;
  // Gemini liczymy osobno, żeby licznik zużycia Claude w panelu był uczciwy.
  if (meta.dostawca === "gemini") {
    const g = (partia.statystykiGemini ||= { wywolan: 0, sekundy: 0, tokenyWe: 0, tokenyCache: 0, tokenyWy: 0 });
    g.wywolan++;
    g.sekundy += meta.sekundy || 0;
    g.tokenyWe += meta.tokenyWe || 0;
    g.tokenyCache += meta.tokenyCache || 0;
    g.tokenyWy += meta.tokenyWy || 0;
    return;
  }
  const s = partia.statystyki;
  s.wywolan++;
  s.sekundy += meta.sekundy || 0;
  s.tokenyWe += meta.tokenyWe || 0;
  s.tokenyCache = (s.tokenyCache || 0) + (meta.tokenyCache || 0);
  s.tokenyWy += meta.tokenyWy || 0;
  s.tury = (s.tury || 0) + (meta.tury || 0);
  s.wyszukiwan += (meta.wyszukiwan || 0) + (meta.pobran || 0);
}

function juzWBazie(f) {
  const nip = f.tozsamosc?.nip || f.nipPodany;
  const poNip = nip && indeks.find((x) => normalizujNip(x.nip) === nip);
  if (poNip) return poNip;
  const s = slugify(f.nazwa);
  return indeks.find((x) => slugify(x.slug) === s || slugify(x.display_name || "") === s || (x.brand_aliases || "").split(",").some((b) => slugify(b) === s)) || null;
}

// Krok 1: kto szuka numeru. Gemini (konto Google, bez zużycia limitu Claude) albo Claude.
// Pierwsze podejście jest tanie (tylko wyszukiwanie); `dokladnie` wolno pobierać strony.
// Tryb ręczny zawsze idzie przez pliki, niezależnie od wyboru.
function szukajNipu(f, dokladnie, opcje) {
  const prompt = promptTozsamosc({ nazwa: f.nazwa, dokladnie });
  if (NIP_GEMINI && !arg.reczny) return zapytajGemini({ prompt, schemat: SCHEMAT_TOZSAMOSC, dokladnie });
  if (dokladnie) return zapytajModel({ nazwaKroku: "1-tozsamosc-dokladnie", prompt, model: MODELE.sredni, schemat: SCHEMAT_TOZSAMOSC, narzedzia: ["WebSearch", "WebFetch"], opcje });
  return zapytajModel({ nazwaKroku: "1-tozsamosc", prompt, model: MODEL.tozsamosc, schemat: SCHEMAT_TOZSAMOSC, narzedzia: ["WebSearch"], opcje });
}

async function przetworzFirme(f) {
  // Firma odznaczona w panelu (np. zły NIP, którego nie da się poprawić) nie idzie dalej.
  if (f.pomin) {
    f.etapy.pominieta = true;
    return;
  }
  const opcje = { ...OPCJE_MODELU, plikFirmy: f.plik };
  const czekaj = (r, krok) => {
    if (r.czeka) {
      f.etapy[krok] = "czeka";
      f.czeka = r.czeka;
      log(`${f.nazwa}: tryb ręczny, uzupełnij ${path.basename(r.czeka)}`);
      return true;
    }
    return false;
  };

  // 1. tożsamość
  if (!f.tozsamosc) {
    let t;
    if (f.nipPodany && czyNip(f.nipPodany)) {
      t = { nazwa_marki: f.nazwa, nip: f.nipPodany, zrodla: ["NIP podany na wejściu"], pewnosc: "wysoka", zModelu: false };
    } else if (arg["tylko-rejestry"]) {
      f.etapy.tozsamosc = "pominieto (brak NIP, --tylko-rejestry)";
      return;
    } else {
      // Bez WebFetch: pobrana strona wchodzi w całości do kontekstu i jest czytana w każdej turze.
      // Wyjątek: firma, której numer rejestry już raz odrzuciły i którą w panelu oznaczono
      // "Szukaj numeru ponownie" — od razu dokładniejsza droga (mocniejszy model, ze stronami).
      const dokladnie = !!f.szukajDokladnie;
      const r = await szukajNipu(f, dokladnie, opcje);
      if (czekaj(r, "tozsamosc")) return;
      if (r.blad) {
        f.etapy.tozsamosc = `błąd: ${r.blad}`;
        f.bledy = [...(f.bledy || []), `tożsamość: ${r.blad}`];
        return;
      }
      zliczStat(r.meta);
      t = { ...r.dane, zModelu: true, meta: r.meta, ...(dokladnie ? { powtorzone: true } : {}) };
      delete f.szukajDokladnie;
    }
    // Tani model + weryfikacja w rejestrach; dopiero gdy numer nie przechodzi kontroli,
    // powtarzamy krok mocniejszym modelem (to rzadkie, więc partia zostaje tania).
    const wolnoPowtorzyc = t.zModelu && !t.powtorzone && (NIP_GEMINI || (!arg["model-tozsamosc"] && MODEL.tozsamosc === MODELE.tani));
    // weryfikacja w MF i KRS (te same reguły dla numeru z modelu i podanego ręcznie)
    async function zweryfikuj(x) {
      x.nip = normalizujNip(x.nip);
      x.krs = x.krs ? normalizujKrs(x.krs) : null;
      const problemy = [];
      if (!czyNip(x.nip)) {
        problemy.push(`NIP ${x.nip || "(pusty)"} ma złą sumę kontrolną`);
        return problemy;
      }
      const mf = (await mfPoNipach([x.nip], DZIS))[x.nip];
      x.mf = mf;
      if (!mf || mf.brak || mf.blad) {
        problemy.push(`MF: ${mf?.blad || "NIP nie występuje w Białej Liście"}`);
        return problemy;
      }
      if (mf.krs && x.krs && mf.krs !== x.krs) problemy.push(`KRS wg MF ${mf.krs} ≠ KRS wg modelu ${x.krs}`);
      if (!x.krs && mf.krs) x.krs = mf.krs;
      if (x.nazwa_spolki && podobienstwoNazw(mf.nazwa, x.nazwa_spolki) < 0.5) problemy.push(`nazwa wg MF "${mf.nazwa}" nie pasuje do "${x.nazwa_spolki}"`);
      if (!x.nazwa_spolki) x.nazwa_spolki = mf.nazwa;
      if (mf.dataWykreslenia) problemy.push(`MF: podmiot wykreślony ${mf.dataWykreslenia}`);
      if (podobienstwoNazw(mf.nazwa, f.nazwa) < 0.3 && !x.zModelu) f.uwagiTozsamosci = `nazwa marki "${f.nazwa}" nie występuje w nazwie spółki "${mf.nazwa}" (może być OK dla spółki-matki)`;
      return problemy;
    }

    let problemy = await zweryfikuj(t);
    if (problemy.length && wolnoPowtorzyc) {
      log(`${f.nazwa}: tani model nie przeszedł kontroli (${problemy.join("; ")}), powtarzam mocniejszym`);
      const r2 = await szukajNipu(f, true, opcje);
      if (!r2.blad && !r2.czeka && r2.dane) {
        zliczStat(r2.meta);
        const t2 = { ...r2.dane, zModelu: true, meta: r2.meta, powtorzone: true, pierwszaProba: { nip: t.nip, problemy } };
        const problemy2 = await zweryfikuj(t2);
        if (problemy2.length < problemy.length) {
          t = t2;
          problemy = problemy2;
        }
      }
    }
    t.status = problemy.length ? "KONFLIKT" : "OK";
    t.powod = problemy.join("; ") || null;
    if (t.pewnosc === "niska") {
      t.status = "KONFLIKT";
      t.powod = [t.powod, `model: niska pewność (${t.uwagi || ""})`].filter(Boolean).join("; ");
    }
    f.tozsamosc = t;
    const wBazie = juzWBazie(f);
    if (wBazie) t.istniejeWBazie = { slug: wBazie.slug, country_code: wBazie.country_code, owner_name: wBazie.owner_name, nip: wBazie.nip, krs: wBazie.krs, verified_at: wBazie.verified_at, id: wBazie.id };
    f.etapy.tozsamosc = t.status;
    zapiszPartie();
    log(`${f.nazwa}: tożsamość ${t.status}${t.powod ? " (" + t.powod + ")" : ""} NIP ${t.nip} KRS ${t.krs || "?"}`);
  }

  // 2. rejestry
  if (!f.rejestr && f.tozsamosc?.krs) {
    f.rejestr = await krsOdpisAktualny(f.tozsamosc.krs);
    if (!f.rejestr.blad) {
      if (f.rejestr.nip && f.rejestr.nip !== f.tozsamosc.nip) {
        f.tozsamosc.status = "KONFLIKT";
        f.tozsamosc.powod = [f.tozsamosc.powod, `NIP wg KRS ${f.rejestr.nip} ≠ ${f.tozsamosc.nip}`].filter(Boolean).join("; ");
      }
      f.historiaKrs = await krsHistoriaWlascicieli(f.tozsamosc.krs);
    }
    f.etapy.rejestr = f.rejestr.blad ? `błąd: ${f.rejestr.blad}` : "OK";
    zapiszPartie();
    log(`${f.nazwa}: KRS ${f.etapy.rejestr}; wspólników ${f.rejestr.wspolnicy?.length || 0}, historia ${f.historiaKrs?.historia?.length || 0} wpisów`);
  } else if (!f.rejestr) {
    f.rejestr = { blad: "brak numeru KRS" };
    f.etapy.rejestr = "brak KRS";
  }
  if (!f.gielda && !arg["bez-gieldy"] && f.tozsamosc?.notowana_gpw && f.tozsamosc?.ticker_bankier) {
    f.gielda = await bankierAkcjonariat(f.tozsamosc.ticker_bankier);
    f.rejestr.giełda = f.gielda;
    zapiszPartie();
  }
  if (arg.crbr && !f.crbr && f.tozsamosc?.nip) {
    f.crbr = await crbrBeneficjenci(f.tozsamosc.nip);
    f.etapy.crbr = f.crbr.blad ? `błąd: ${f.crbr.blad}` : f.crbr.brak ? "brak wpisu" : `OK (${f.crbr.liczbaBeneficjentow} benef.)`;
    zapiszPartie();
    log(`${f.nazwa}: CRBR ${f.etapy.crbr}`);
  }
  if (arg["tylko-rejestry"]) {
    f.etapy.sledztwo = "pominieto (--tylko-rejestry)";
    return;
  }
  // Przystanek na NIP: dalej (śledztwo, opisy) dopiero po potwierdzeniu tożsamości w panelu.
  if (arg["stop-po-nip"]) {
    f.etapy.sledztwo = "czeka na potwierdzenie NIP";
    zapiszPartie();
    return;
  }

  // 3. śledztwo
  if (!f.sledztwo) {
    const r = await zapytajModel({ nazwaKroku: "3-sledztwo", prompt: promptSledztwo({ nazwa: f.nazwa, tozsamosc: f.tozsamosc, rejestr: f.rejestr, historiaKrs: f.historiaKrs, gielda: f.gielda, crbr: f.crbr, dzisiaj: DZIS }), model: MODEL.sledztwo, schemat: SCHEMAT_SLEDZTWO, narzedzia: ["WebSearch", "WebFetch"], opcje, timeoutMs: 25 * 60 * 1000 });
    if (czekaj(r, "sledztwo")) return;
    if (r.blad) {
      f.etapy.sledztwo = `błąd: ${r.blad}`;
      f.bledy = [...(f.bledy || []), `śledztwo: ${r.blad}`];
      zapiszPartie();
      return;
    }
    zliczStat(r.meta);
    f.sledztwo = { ...r.dane, meta: r.meta };
    f.sledztwo.country_code = normalizujKrajOdModelu(f.sledztwo.country_code);
    f.etapy.sledztwo = "OK";
    zapiszPartie();
    log(`${f.nazwa}: śledztwo → ${f.sledztwo.country_code || "??"} / ${f.sledztwo.ostateczny_wlasciciel} (${f.sledztwo.regula}), ogniw ${f.sledztwo.lancuch?.length || 0}, ${r.meta?.sekundy || "?"} s`);
  }

  // 4. kontrola
  if (!f.kontrola) {
    const r = await zapytajModel({ nazwaKroku: "4-kontrola", prompt: promptKontrola({ nazwa: f.nazwa, sledztwo: f.sledztwo, rejestr: f.rejestr, dzisiaj: DZIS }), model: MODEL.kontrola, schemat: SCHEMAT_KONTROLA, narzedzia: ["WebFetch"], opcje });
    if (czekaj(r, "kontrola")) return;
    if (r.blad) {
      f.etapy.kontrola = `błąd: ${r.blad}`;
      f.kontrola = { zgadza_sie: null, zastrzezenia: [`kontrola nie wykonana: ${r.blad}`], zrodla_zweryfikowane: [] };
    } else {
      zliczStat(r.meta);
      f.kontrola = { ...r.dane, meta: r.meta };
      f.kontrola.country_code = normalizujKrajOdModelu(f.kontrola.country_code);
      f.etapy.kontrola = f.kontrola.zgadza_sie ? "zgodna" : "NIEZGODNA";
    }
    zapiszPartie();
    log(`${f.nazwa}: kontrola ${f.etapy.kontrola} (${f.kontrola.pewnosc_proponowana || "?"})`);
  }

  // 5. opisy
  if (!f.opisy) {
    const r = await zapytajModel({ nazwaKroku: "5-opisy", prompt: promptOpisy({ nazwa: f.nazwa, tozsamosc: f.tozsamosc, sledztwo: f.sledztwo, rejestr: f.rejestr, kategorie, dzisiaj: DZIS }), model: MODEL.opisy, schemat: SCHEMAT_OPISY, narzedzia: ["WebFetch"], opcje });
    if (czekaj(r, "opisy")) return;
    if (r.blad) {
      f.etapy.opisy = `błąd: ${r.blad}`;
      f.bledy = [...(f.bledy || []), `opisy: ${r.blad}`];
      zapiszPartie();
      return;
    }
    zliczStat(r.meta);
    f.opisy = { ...r.dane, meta: r.meta };
    f.etapy.opisy = "OK";
  }

  zlozRekord(f, { kategorie, dzisiaj: DZIS });
  zapiszPartie();
  log(`${f.nazwa}: ${f.status} ${f.konflikty.length ? "→ " + f.konflikty.join(" | ") : ""}`);
}



// przeliczenie gotowych rekordów po zmianie reguł walidacji
if (arg.przelicz) {
  for (const f of partia.firmy) if (f.opisy && f.sledztwo) zlozRekord(f, { kategorie, dzisiaj: f.rekord?.verified_at || DZIS });
  zapiszPartie();
  log(`przeliczono ${partia.firmy.filter((f) => f.rekord).length} rekordów`);
}

// kolejka z ograniczoną równoległością
partia.przystanekNip = !!arg["stop-po-nip"];
const doZrobienia = partia.firmy.filter((f) => !f.pomin && (!f.rekord || f.etapy?.sledztwo === "czeka" || f.etapy?.kontrola === "czeka" || f.etapy?.opisy === "czeka" || f.etapy?.tozsamosc === "czeka"));
log(`do przetworzenia: ${doZrobienia.length} z ${partia.firmy.length} (równolegle ${ROWNOLEGLE}, modele: ${Object.entries(MODEL).map(([k, v]) => k + "=" + v).join(", ")})`);
let i = 0;
await Promise.all(
  Array.from({ length: Math.min(ROWNOLEGLE, doZrobienia.length) }, async () => {
    while (i < doZrobienia.length) {
      const f = doZrobienia[i++];
      try {
        await przetworzFirme(f);
      } catch (e) {
        f.bledy = [...(f.bledy || []), `wyjątek: ${e.message}`];
        log(`${f.nazwa}: WYJĄTEK ${e.message}`);
        zapiszPartie();
      }
    }
  }),
);

// podsumowanie
const st = { WYSOKA: 0, SREDNIA: 0, KONFLIKT: 0, czeka: 0, nip: 0, pominiete: 0, blad: 0 };
for (const f of partia.firmy) {
  if (f.pomin) st.pominiete++;
  else if (f.czeka && !f.rekord) st.czeka++;
  else if (f.etapy?.sledztwo === "czeka na potwierdzenie NIP") st.nip++;
  else if (f.status) st[f.status]++;
  else st.blad++;
}
zapiszPartie();
console.log(`\nPartia ${NAZWA_PARTII}: ${partia.firmy.length} firm → WYSOKA ${st.WYSOKA}, ŚREDNIA ${st.SREDNIA}, KONFLIKT ${st.KONFLIKT}, czeka ${st.czeka}, błąd ${st.blad}${st.nip ? `, do potwierdzenia NIP ${st.nip}` : ""}${st.pominiete ? `, pominięte ${st.pominiete}` : ""}`);
if (st.nip) console.log(`Przystanek na NIP: potwierdź numery w panelu (node tools/firmy/panel.mjs) albo uruchom ponownie bez --stop-po-nip.`);
if (partia.statystyki.wywolan) {
  const s = partia.statystyki;
  console.log(`Model: ${s.wywolan} wywołań, ${s.tury || "?"} tur, ${Math.round(s.sekundy / 60)} min, ${Math.round(s.tokenyWe / 1000)}k tokenów wejścia (+${Math.round((s.tokenyCache || 0) / 1000)}k z cache), ${Math.round(s.tokenyWy / 1000)}k wyjścia.`);
}
if (st.czeka) console.log(`Tryb ręczny: uzupełnij pliki .odpowiedz.json w ${path.join(KATALOG_PARTII, "reczne", NAZWA_PARTII)} i uruchom ponownie z --partia ${NAZWA_PARTII}${arg.reczny ? " --reczny" : ""}.`);
console.log(`Plik: ${PLIK_PARTII}\nPrzegląd: node tools/firmy/przeglad.mjs --partia ${NAZWA_PARTII}`);
