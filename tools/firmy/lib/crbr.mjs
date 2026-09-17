// Centralny Rejestr Beneficjentów Rzeczywistych (CRBR) przez przeglądarkę (puppeteer).
// Serwis nie ma oficjalnego API: formularz na crbr.podatki.gov.pl woła POST /adcrbr/api/wyszukajSpolke,
// ale to samo żądanie z curl jest odrzucane, więc sterujemy prawdziwą przeglądarką i przechwytujemy
// odpowiedź. Zwracamy WYŁĄCZNIE dane zagregowane: liczba beneficjentów, obywatelstwa, rodzaj
// uprawnień, procenty. Żadnych nazwisk, dat urodzenia ani numerów PESEL (odpowiedź je zawiera).
import { normalizujNip } from "./tekst.mjs";

const URL_CRBR = "https://crbr.podatki.gov.pl/adcrbr/#/wyszukaj";

// Kody "charakterUdzialu" z formularza CRBR (obserwacja odpowiedzi API, 2026-09):
// 1 = udziały/akcje (własność bezpośrednia), 2 = własność pośrednia, 3 = inne uprawnienia
// (np. osoba na wyższym stanowisku kierowniczym, gdy nie ma osoby fizycznej z >25%).
const CHARAKTER = { 1: "własność bezpośrednia", 2: "własność pośrednia", 3: "inne uprawnienia (brak osoby z >25%)" };

export async function crbrBeneficjenci(nip, opcje = {}) {
  const n = normalizujNip(nip);
  if (n.length !== 10) return { blad: "zły NIP" };
  let puppeteer;
  try {
    puppeteer = (await import("puppeteer")).default;
  } catch {
    return { blad: "brak puppeteera (npm install)" };
  }
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const timeoutMs = opcje.timeoutMs || 60000;
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36");
    // networkidle nie nadaje się: skrypty Incapsula odpytują serwer bez końca.
    await page.goto(URL_CRBR, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    const nipInput = await page.waitForSelector('input[formcontrolname="nip"]', { timeout: timeoutMs });
    await nipInput.click({ clickCount: 3 });
    await nipInput.type(n, { delay: 20 });
    await new Promise((r) => setTimeout(r, 500)); // Angular musi zdążyć zwalidować formularz
    const czekajNaOdpowiedz = page.waitForResponse((r) => r.url().includes("/adcrbr/api/wyszukajSpolke") && r.request().method() === "POST", { timeout: timeoutMs });
    const kliknieto = await page.evaluate(() => {
      const przycisk = [...document.querySelectorAll("button")].find((e) => e.textContent && e.textContent.trim() === "Wyszukaj" && !e.disabled);
      if (!przycisk) return false;
      przycisk.click();
      return true;
    });
    if (!kliknieto) return { blad: "nie znaleziono przycisku Wyszukaj (zmiana układu strony CRBR)" };
    const odp = await czekajNaOdpowiedz;
    if (odp.status() !== 200) return { blad: `CRBR HTTP ${odp.status()}` };
    const dane = await odp.json();
    const spolki = dane?.informacjeOSpolkachIBeneficjentach || [];
    if (!spolki.length) return { brak: true, uwaga: "brak wpisu w CRBR dla tego NIP (podmiot może nie podlegać obowiązkowi albo zgłoszenie jest w toku)" };
    const s = spolki[0];
    const beneficjenci = (s.listaBeneficjentow || []).map((b) => {
      const upr = b.informacjeOUdzialeLubUprawnieniach || [];
      return {
        obywatelstwo: (b.obywatelstwo || []).map((o) => o.kodKraju).filter(Boolean),
        krajZamieszkania: b.panstwoZamieszkania?.kodKraju || null,
        beneficjentGrupowy: b.nazwaBeneficjentaGrupowego || null,
        uprawnienia: upr.map((u) => ({
          charakter: CHARAKTER[u.charakterUdzialu] || String(u.charakterUdzialu),
          rodzaj: u.rodzajWlasnosciOpis || null,
          ilosc: u.ilosc != null ? Number(String(u.ilosc).replace(",", ".")) : null,
          jednostka: u.jednostkaMiaryUdzialuOpis || null,
          posrednie: !!u.uprWlasPosrednie,
          inne: u.inneUprBO?.rodzajInnychUprawnien?.opis || null,
        })),
      };
    });
    const zProcentem = beneficjenci.filter((b) => b.uprawnienia.some((u) => u.ilosc != null && /proc|%/i.test(u.jednostka || "")));
    return {
      nazwa: s.spolka?.pelnaNazwa || null,
      krs: s.spolka?.krs || null,
      stanNa: s.dataPoczatkuPrezentacji || null,
      liczbaBeneficjentow: beneficjenci.length,
      tylkoKadraKierownicza: beneficjenci.length > 0 && beneficjenci.every((b) => b.uprawnienia.every((u) => u.charakter === CHARAKTER[3])),
      obywatelstwa: [...new Set(beneficjenci.flatMap((b) => b.obywatelstwo))],
      beneficjenci,
      podsumowanie: beneficjenci.length
        ? beneficjenci.every((b) => b.uprawnienia.every((u) => u.charakter === CHARAKTER[3]))
          ? `CRBR: ${beneficjenci.length} osób zgłoszonych jako kadra kierownicza (żadna osoba fizyczna nie ma >25% udziałów lub głosów); obywatelstwa: ${[...new Set(beneficjenci.flatMap((b) => b.obywatelstwo))].join(", ") || "?"}.`
          : `CRBR: ${beneficjenci.length} beneficjentów rzeczywistych, w tym ${zProcentem.length} z podanym udziałem procentowym; obywatelstwa: ${[...new Set(beneficjenci.flatMap((b) => b.obywatelstwo))].join(", ") || "?"}.`
        : "CRBR: brak beneficjentów w zgłoszeniu.",
      zrodloUrl: "https://crbr.podatki.gov.pl/adcrbr/#/wyszukaj",
      pobrano: new Date().toISOString().slice(0, 10),
    };
  } catch (e) {
    return { blad: `CRBR: ${e.message.slice(0, 160)}` };
  } finally {
    await browser.close().catch(() => {});
  }
}
