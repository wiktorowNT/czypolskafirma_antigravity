// Przegląd tożsamości całej bazy (backlog 2026-09, zadanie 7): czy NIP i KRS każdej firmy
// wskazują właściwą, aktywną spółkę. Tylko odczyt: baza kluczem anon, Biała Lista MF, API KRS.
// Nic nie zapisuje do Supabase; wynik to raport do decyzji właściciela.
//
//   node tools/firmy/przeglad-tozsamosci.mjs                 (pobiera, co brakuje w cache, i pisze raport)
//   node tools/firmy/przeglad-tozsamosci.mjs --bez-krs       (tylko MF, bez odpisów KRS)
//   node tools/firmy/przeglad-tozsamosci.mjs --tylko-raport  (raport z cache, bez zapytań)
//
// Cache: data/robocze/tozsamosc-cache.json (poza gitem); przerwany przebieg wznawia się od miejsca przerwania.
// Limit MF: 100 zapytań na dobę (30 NIP-ów na zapytanie), więc 750 firm to ok. 25 zapytań.
import fs from "node:fs";
import path from "node:path";
import { KATALOG_REPO, dzisiaj } from "./lib/env.mjs";
import { indeksFirm } from "./lib/supabase.mjs";
import { krsOdpisAktualny, mfLicznik, mfPoNipach } from "./lib/rejestry.mjs";
import { czyNip, normalizujKrs, normalizujNazwe, normalizujNip, podobienstwoNazw } from "./lib/tekst.mjs";

const arg = new Set(process.argv.slice(2));
const PLIK_CACHE = path.join(KATALOG_REPO, "data", "robocze", "tozsamosc-cache.json");
const PLIK_RAPORTU = path.join(KATALOG_REPO, "docs", `PRZEGLAD_TOZSAMOSCI_${dzisiaj().slice(0, 7)}.md`);
// Ta sama lista co w lib/rekord.mjs (ostrzeżenie o spółce celowej przy nowych firmach).
const SPOLKA_CELOWA = /E-?COM|ONLINE|E-?SKLEP|LOGISTY|NIERUCHOMO|SERWIS|SERVICE|FINANC|LEASING|DYSTRYBUC|INVESTMENT|HOLDING|SHARED SERVICES|CENTRUM USŁUG/i;

const cache = fs.existsSync(PLIK_CACHE) ? JSON.parse(fs.readFileSync(PLIK_CACHE, "utf8")) : { mf: {}, krs: {} };
const zapiszCache = () => fs.writeFileSync(PLIK_CACHE, JSON.stringify(cache, null, 1), "utf8");

const firmy = await indeksFirm();
console.log(`firm w bazie: ${firmy.length}`);

if (!arg.has("--tylko-raport")) {
  // 1. Biała Lista MF
  const nipyDoMf = [...new Set(firmy.map((f) => normalizujNip(f.nip)).filter((n) => czyNip(n) && !cache.mf[n]))];
  const potrzeba = Math.ceil(nipyDoMf.length / 30);
  const { zostalo } = mfLicznik();
  if (potrzeba > zostalo) {
    console.log(`MF: potrzeba ${potrzeba} zapytań, na dziś zostało ${zostalo}. Sprawdzam tyle, ile się da; reszta jutro.`);
    nipyDoMf.length = zostalo * 30;
  }
  for (let i = 0; i < nipyDoMf.length; i += 30) {
    const wynik = await mfPoNipach(nipyDoMf.slice(i, i + 30), dzisiaj());
    for (const [nip, w] of Object.entries(wynik)) if (!w.blad || w.brak) cache.mf[nip] = w;
    zapiszCache();
    console.log(`MF: ${Math.min(i + 30, nipyDoMf.length)}/${nipyDoMf.length}`);
  }

  // 2. Odpisy KRS (numer z bazy i numer z MF, jeśli różne)
  if (!arg.has("--bez-krs")) {
    const krsy = new Set();
    for (const f of firmy) {
      for (const k of [f.krs, cache.mf[normalizujNip(f.nip)]?.krs]) {
        const nr = normalizujKrs(k);
        if (nr.length === 10 && nr !== "0000000000" && !cache.krs[nr]) krsy.add(nr);
      }
    }
    let n = 0;
    for (const nr of krsy) {
      const o = await krsOdpisAktualny(nr);
      // błędy sieciowe nie trafiają do cache, żeby następny przebieg spróbował ponownie
      if (!o.blad || /404|struktura|nie-JSON/.test(o.blad)) {
        // HTTP 204 (pusta odpowiedź) API KRS zwraca m.in. dla podmiotów wykreślonych
        cache.krs[nr] = o.blad ? { blad: o.blad === "nie-JSON" ? "KRS zwraca pusty odpis (podmiot wykreślony albo w innym rejestrze)" : o.blad } : { nazwa: o.nazwa, nip: o.nip, formaPrawna: o.formaPrawna, stanZDnia: o.stanZDnia };
      }
      if (++n % 25 === 0 || n === krsy.size) {
        zapiszCache();
        console.log(`KRS: ${n}/${krsy.size}`);
      }
    }
    zapiszCache();
  }
}


// 3. Analiza. Pole `name` w bazie to nazwa prawna z MF, więc porównujemy markę (display_name,
// slug, brand_aliases) z nazwą spółki z rejestru i łączymy to z sygnałami z MF i KRS.
const marka = (f) => f.display_name || f.slug.replace(/-/g, " ");
const link = (f) => `[${marka(f)}](https://czypolskafirma.pl/firma/${f.slug})`;
const esc = (s) => String(s ?? "").replace(/\|/g, "/");
const wyniki = [], brakNip = [], wgNipu = new Map();
// Marka jako skrót nazwy spółki (PZU = Powszechny Zakład Ubezpieczeń): 1, inaczej 0.
const skrot = (kandydaci, nazwa) => {
  const inicjaly = normalizujNazwe(nazwa).split(" ").filter(Boolean).map((w) => w[0]).join("");
  return kandydaci.some((k) => { const s = normalizujNazwe(k).replace(/ /g, ""); return s.length >= 2 && inicjaly.startsWith(s); }) ? 1 : 0;
};

for (const f of firmy) {
  const nip = normalizujNip(f.nip);
  if (!nip) { brakNip.push(f); continue; }
  const r = { f, nip, mocne: [], srednie: [], info: [] };
  wyniki.push(r);
  if (!czyNip(nip)) { r.mocne.push("NIP ma złą sumę kontrolną albo długość"); continue; }
  wgNipu.set(nip, [...(wgNipu.get(nip) || []), f]);
  const mf = cache.mf[nip];
  if (!mf) { r.info.push("nie sprawdzono w MF (limit dzienny)"); continue; }
  const krsBaza = normalizujKrs(f.krs), krsMf = mf.brak ? "" : normalizujKrs(mf.krs);
  const nrKrs = krsMf || krsBaza;
  const odpis = nrKrs && nrKrs !== "0000000000" ? cache.krs[nrKrs] : null;
  const krsPotwierdza = odpis && !odpis.blad && normalizujNip(odpis.nip) === nip;
  r.nazwaSpolki = (odpis && !odpis.blad && odpis.nazwa) || (!mf.brak && mf.nazwa) || f.name || "";
  r.krs = nrKrs;

  if (mf.brak) {
    if (krsPotwierdza) r.info.push("brak w wykazie VAT, ale KRS potwierdza NIP (grupa VAT, oddział albo podmiot zwolniony)");
    else r.srednie.push(odpis ? "NIP nieznany w wykazie VAT i KRS go nie potwierdza" : "NIP nieznany w wykazie VAT, brak KRS do sprawdzenia");
  } else if (mf.dataWykreslenia || (mf.statusVat && mf.statusVat !== "Czynny")) {
    const opis = `VAT: ${mf.statusVat || "?"}${mf.dataWykreslenia ? `, wykreślony ${mf.dataWykreslenia}` : ""}`;
    (krsPotwierdza ? r.info : r.srednie).push(krsPotwierdza ? `${opis} (KRS aktywny z tym NIP-em, pewnie grupa VAT)` : opis);
  }
  if (odpis?.blad) r.srednie.push(`KRS ${nrKrs}: ${odpis.blad}`);
  else if (odpis?.nip && normalizujNip(odpis.nip) !== nip) r.mocne.push(`KRS ${nrKrs} podaje NIP ${odpis.nip}`);
  if (krsBaza && krsMf && krsBaza !== krsMf) r.srednie.push(`KRS w bazie ${krsBaza}, w MF ${krsMf}`);
  if (/W LIKWIDACJI|W UPADŁOŚCI|W RESTRUKTURYZACJI/i.test(r.nazwaSpolki)) r.mocne.push("spółka w likwidacji, upadłości lub restrukturyzacji");

  const kandydaci = [marka(f), f.slug.replace(/-/g, " "), ...String(f.brand_aliases || "").split(",")].map((s) => s.trim()).filter(Boolean);
  r.podob = r.nazwaSpolki ? Math.max(...kandydaci.map((k) => podobienstwoNazw(k, r.nazwaSpolki)), skrot(kandydaci, r.nazwaSpolki)) : 1;
  if (SPOLKA_CELOWA.test(r.nazwaSpolki) && r.podob < 0.5) r.srednie.push("nazwa jak spółka celowa (e-com, holding, finanse, dystrybucja…)");
  if (r.podob < 0.3) (r.srednie.length || r.info.some((i) => i.startsWith("VAT")) ? r.mocne : r.info).push(`marka niepodobna do nazwy spółki (${r.podob.toFixed(2)})`);
}
const duplikaty = [...wgNipu].filter(([, l]) => l.length > 1);
const mocne = wyniki.filter((r) => r.mocne.length).sort((a, b) => b.mocne.length - a.mocne.length || a.podob - b.podob);
const srednie = wyniki.filter((r) => !r.mocne.length && r.srednie.length).sort((a, b) => a.podob - b.podob);
const grupaVat = wyniki.filter((r) => !r.mocne.length && !r.srednie.length && r.info.some((i) => /VAT/.test(i)));
const tylkoNazwa = wyniki.filter((r) => !r.mocne.length && !r.srednie.length && r.info.some((i) => i.startsWith("marka niepodobna")) && !grupaVat.includes(r)).sort((a, b) => a.podob - b.podob);
const nieSprawdzone = wyniki.filter((r) => r.info.some((i) => i.startsWith("nie sprawdzono")));

// 4. Raport
const tabela = (naglowki, wiersze) => wiersze.length
  ? [`| ${naglowki.join(" | ")} |`, `|${naglowki.map(() => "---").join("|")}|`, ...wiersze.map((w) => `| ${w.map(esc).join(" | ")} |`)].join("\n")
  : "_Brak._";
const wierszFirmy = (r, pola) => [link(r.f), r.nip, r.nazwaSpolki || "", pola.join("; ")];
const NAGL = ["Firma", "NIP", "Spółka wg rejestru", "Sygnały"];

const md = `# Przegląd tożsamości firm w bazie (${dzisiaj()})

> Wygenerowane przez \`node tools/firmy/przeglad-tozsamosci.mjs\` (backlog 2026-09, zadanie 7).
> Tylko odczyt: baza (klucz publiczny), Biała Lista VAT MF, API KRS. **Żadnych zmian w bazie.**
> Dalej decyduje właściciel: dla potwierdzonych błędów partia \`--reweryfikacja\` bez NIP-u
> (automat znajdzie numer od nowa) albo poprawka NIP-u w panelu.

## Podsumowanie

| | Liczba |
|---|---|
| Firm w bazie | ${firmy.length} |
| Sprawdzonych w MF / odpisów KRS | ${wyniki.length - nieSprawdzone.length} / ${Object.keys(cache.krs).length} |
| **1. Mocne podejrzenie, że NIP wskazuje zły podmiot** | **${mocne.length}** |
| 2. Do sprawdzenia | ${srednie.length} |
| 3. Brak w wykazie VAT lub wykreślone, ale KRS potwierdza NIP | ${grupaVat.length} |
| 4. Marka niepodobna do nazwy spółki, brak innych sygnałów | ${tylkoNazwa.length} |
| 5. Kilka firm z tym samym NIP-em | ${duplikaty.length} |
| 6. Brak NIP-u | ${brakNip.length} |
${nieSprawdzone.length ? `| Nie sprawdzono (limit MF, uruchom jutro ponownie) | ${nieSprawdzone.length} |\n` : ""}
Jak czytać: pole \`name\` w bazie to nazwa prawna spółki pod danym NIP-em, więc błędny NIP
nie rzuca się w oczy (np. marka LEGO z nazwą „Skłodowscy Yachting”). Skrypt porównuje markę
z nazwą spółki i łączy to z sygnałami z rejestrów. Samo „marka niepodobna” jest normalne
(Biedronka i Jeronimo Martins Polska), dlatego to osobna, najsłabsza lista.

## 1. Mocne podejrzenie

Suma kontrolna, KRS z innym NIP-em, spółka w likwidacji albo niepodobna nazwa połączona
z wykreśleniem z VAT lub brakiem w rejestrach. Tu najpewniej są błędy jak przy Mokate.

${tabela(NAGL, mocne.map((r) => wierszFirmy(r, [...r.mocne, ...r.srednie, ...r.info])))}

## 2. Do sprawdzenia

Jeden słabszy sygnał: NIP nieznany w wykazie VAT bez potwierdzenia w KRS, rozbieżny KRS,
wykreślenie z VAT bez potwierdzenia w KRS albo nazwa jak spółka celowa.

${tabela(NAGL, srednie.map((r) => wierszFirmy(r, [...r.srednie, ...r.info])))}

## 3. Wykaz VAT mówi „brak” lub „wykreślony”, ale KRS potwierdza NIP

Zwykle grupa VAT (od 2023 r. duże grupy rozliczają VAT wspólnie, a spółki znikają z wykazu)
albo oddział zagranicznej spółki. NIP jest najpewniej dobry; informacyjnie.

${tabela(NAGL, grupaVat.map((r) => wierszFirmy(r, r.info)))}

## 4. Marka niepodobna do nazwy spółki, brak innych sygnałów

Najczęściej w porządku (marka handlowa inna niż nazwa spółki). Warto przejrzeć wzrokiem
górę listy, posortowanej od najmniej podobnych.

${tabela(["Firma", "NIP", "Spółka wg rejestru", "Podob."], tylkoNazwa.map((r) => [link(r.f), r.nip, r.nazwaSpolki, r.podob.toFixed(2)]))}

## 5. Kilka firm z tym samym NIP-em

Jedna spółka z kilkoma markami jest w porządku, ale sprawdź, czy każda marka naprawdę do niej należy.

${tabela(["NIP", "Spółka", "Firmy"], duplikaty.map(([nip, l]) => [nip, cache.mf[nip]?.nazwa || l[0].name || "", l.map(link).join(", ")]))}

## 6. Brak NIP-u

${brakNip.length ? brakNip.map(link).join(", ") : "_Brak._"}
`;

fs.writeFileSync(PLIK_RAPORTU, md, "utf8");
console.log(`raport: ${path.relative(KATALOG_REPO, PLIK_RAPORTU)}`);
console.log({ mocne: mocne.length, srednie: srednie.length, grupaVat: grupaVat.length, tylkoNazwa: tylkoNazwa.length, duplikaty: duplikaty.length, brakNip: brakNip.length, nieSprawdzone: nieSprawdzone.length });
