// Reorganizacja kategorii (02.10.2026): 8 nowych kategorii wydzielonych z przepełnionych
// (Żywność, Handel, IT, Media, Banki, Transport, Elektronika, Moda) + nowe opisy granic.
//
//   node tools/reorganizacja-kategorii-2026-10.mjs            # dry-run: pokazuje, co się zmieni
//   node tools/reorganizacja-kategorii-2026-10.mjs --zapisz   # kopia + zapis do Supabase
//
// Przed zapisem robi kopię przypisań (id, slug, category_id, category_slug) i opisów kategorii
// do data/robocze/backup/. Cofnięcie: --przywroc <plik-kopii>.
import fs from "node:fs";
import path from "node:path";
import { odczyt, wstaw, aktualizuj, wszystkieFirmyPelne } from "./firmy/lib/supabase.mjs";
import { KATALOG_REPO } from "./firmy/lib/env.mjs";

const NOWE = [
  {
    slug: "napoje-i-alkohole", name: "Napoje i alkohole", icon: "Wine",
    description: "Producenci napojów bezalkoholowych (wody mineralne, soki, napoje gazowane, energetyczne i funkcjonalne), browary, gorzelnie oraz producenci wódek, win i likierów. Nie zaliczamy: kawy i herbaty (Żywność), firm, dla których napoje są tylko dodatkiem do żywności (Żywność), barów i kawiarni (Gastronomia), sklepów z alkoholem (Handel).",
    firmy: ["ambra", "belvedere", "browar-amber", "browar-fortuna", "browar-kormoran", "browary-regionalne-jakubiak", "carlsberg", "cisowianka-naleczow-zdroj", "coca-cola", "foodcare", "grupa-zywiec", "jurajska", "kofola-hoop-cola", "kompania-piwowarska", "krupnik", "krynica-vitamin", "monster-energy", "muszynianka", "naleczowianka", "oshee", "pepsico", "perla-browary-lubelskie", "piwniczanka", "red-bull", "soplica", "staropolanka", "stock-polska", "ustronianka", "van-pur", "wyborowa-pernod-ricard", "wysowianka", "zywiec-zdroj"],
  },
  {
    slug: "fintech-i-platnosci", name: "Fintech i płatności", icon: "CreditCard",
    description: "Operatorzy płatności internetowych i mobilnych, systemy kartowe, płatności odroczone (BNPL), fintechy z kontem w aplikacji oraz brokerzy i platformy inwestycyjne online. Nie zaliczamy: banków komercyjnych i spółdzielczych, firm pożyczkowych i windykacyjnych (Banki), ubezpieczycieli (Ubezpieczenia), oprogramowania dla banków (IT-Technologie).",
    firmy: ["klarna", "mastercard", "paypal", "revolut", "visa", "xtb", "autopay", "blik", "payu", "paypo", "przelewy24", "skycash", "tpay", "twisto"],
  },
  {
    slug: "turystyka-i-podroze", name: "Turystyka i podróże", icon: "Plane",
    description: "Biura podróży i touroperatorzy, internetowe platformy rezerwacji wycieczek i noclegów, sieci hotelowe oraz atrakcje turystyczne (parki rozrywki, parki wodne, koleje linowe). Nie zaliczamy: linii lotniczych, kolei i autokarów (Transport), restauracji (Gastronomia), kin (Media i Rozrywka).",
    firmy: ["itaka", "rainbow-tours", "tui-poland", "coral-travel", "grecos", "esky", "wakacje-pl", "booking-com", "airbnb", "orbis", "polskie-koleje-linowe", "energylandia", "suntago"],
  },
  {
    slug: "sport-i-fitness", name: "Sport i fitness", icon: "Dumbbell",
    description: "Marki odzieży, obuwia i sprzętu sportowego i outdoorowego, sieci sklepów sportowych, producenci rowerów, odżywek i suplementów dla sportowców oraz karty i sieci fitness. Nie zaliczamy: marek modowych i streetwearowych bez profilu sportowego (Moda), sklepów z obuwiem wielu marek (Handel), producentów motocykli i samochodów (Motoryzacja).",
    firmy: ["4f", "nike", "adidas", "puma", "asics", "new-balance", "reebok", "the-north-face", "decathlon", "martes-sport", "intersport", "kross", "romet", "olimp-sport-nutrition", "trec-nutrition", "ostrovit", "allnutrition", "benefit-systems"],
  },
  {
    slug: "gry-wideo", name: "Gry wideo", icon: "Gamepad2",
    description: "Studia deweloperskie i wydawcy gier wideo na PC, konsole i urządzenia mobilne. Nie zaliczamy: gier planszowych i zabawek (Dzieci i zabawki), zakładów bukmacherskich i gier liczbowych (Media i Rozrywka), sklepów z grami (Handel), sprzętu gamingowego (Elektronika).",
    firmy: ["11-bit-studios", "bloober-team", "cd-projekt-red", "ci-games", "people-can-fly", "playway", "techland", "ten-square-games"],
  },
  {
    slug: "dzieci-i-zabawki", name: "Dzieci i zabawki", icon: "Baby",
    description: "Producenci zabawek, klocków, puzzli i gier planszowych, artykułów dziecięcych (wózki, foteliki, akcesoria dla niemowląt), marki odzieży dziecięcej oraz sieci sklepów dla dzieci. Nie zaliczamy: żywności dla niemowląt (Żywność), pieluch i artykułów higienicznych (Zdrowie), gier wideo (Gry wideo).",
    firmy: ["lego", "mattel", "hasbro", "trefl", "granna", "alexander", "cobi", "canpol-babies", "kinderkraft", "smyk", "coccodrillo"],
  },
  {
    slug: "agd", name: "AGD", icon: "Refrigerator",
    description: "Producenci i marki sprzętu AGD: dużego (lodówki, pralki, zmywarki, kuchenki, piekarniki) i małego (ekspresy, odkurzacze, roboty kuchenne, blendery, żelazka). Nie zaliczamy: telewizorów, komputerów i smartfonów (Elektronika), elektronarzędzi i myjek ciśnieniowych (Dom i ogród), sklepów ze sprzętem RTV/AGD (Handel).",
    firmy: ["amica", "beko", "bsh", "de-longhi", "dyson", "eldom", "electrolux", "gorenje", "haier", "kernau", "krups", "miele", "mpm", "tefal", "vorwerk", "whirlpool", "zelmer"],
  },
  {
    slug: "dom-i-ogrod", name: "Dom i ogród", icon: "House",
    description: "Markety budowlane i sieci typu „zrób to sam” (DIY), producenci i marki narzędzi ręcznych, elektronarzędzi i sprzętu ogrodowego, urządzeń czyszczących oraz marki artykułów do domu i dekoracji wnętrz. Nie zaliczamy: materiałów budowlanych, okien i drzwi (Budownictwo), mebli (Meble), sprzętu AGD (AGD).",
    firmy: ["leroy-merlin", "castorama", "obi", "bricoman", "bricomarche", "mrowka", "jula", "merkury-market", "makita", "yato", "topex", "karcher", "duka", "home-you"],
  },
];

// Nowe opisy istniejących kategorii: granice z nowymi kategoriami.
const OPISY = {
  "żywność": "Producenci żywności: przetwórstwo spożywcze, zakłady mięsne i drobiarskie, mleczarnie, piekarnie, producenci słodyczy i przekąsek, kawy i herbaty, mrożonek, przypraw, karmy dla zwierząt oraz rolnictwo. Nie zaliczamy: wód, soków, napojów, piwa i alkoholi (Napoje i alkohole), odżywek dla sportowców (Sport i fitness), suplementów diety (Farmacja), supermarketów i sklepów spożywczych (Handel), nawozów rolniczych (Chemia), restauracji (Gastronomia), wyrobów tytoniowych i nikotynowych.",
  "handel": "Sieci detaliczne i hurtownie, platformy e-commerce, dystrybutorzy i importerzy. Firmy, które głównie sprzedają produkty innych marek. Nie zaliczamy: producentów sprzedających wyłącznie własny asortyment we własnych sklepach (np. marka odzieżowa z własną siecią), marketów budowlanych (Dom i ogród), sklepów sportowych (Sport i fitness), sklepów dla dzieci (Dzieci i zabawki), biur podróży (Turystyka i podróże).",
  "it-technologie": "Tworzenie oprogramowania (software house'y, twórcy SaaS), usługi chmurowe, cyberbezpieczeństwo, konsulting IT, platformy internetowe i ogłoszeniowe. Nie zaliczamy: gier wideo (Gry wideo), operatorów płatności i fintechów (Fintech i płatności), platform rezerwacji podróży i noclegów (Turystyka i podróże), marketplace'ów służących pośrednictwu w sprzedaży (Handel), produkcji sprzętu komputerowego (Elektronika), agencji marketingowych (Media i Rozrywka).",
  "media-i-rozrywka": "Telewizja, radio, prasa, portale informacyjne, wydawnictwa, platformy streamingowe (VOD, muzyka, audiobooki), kina oraz gry liczbowe i zakłady wzajemne. Nie zaliczamy: gier wideo (Gry wideo), zabawek i gier planszowych (Dzieci i zabawki), parków rozrywki i atrakcji (Turystyka i podróże), usług dostępu do internetu i TV (Telekomunikacja), oprogramowania biznesowego (IT-Technologie).",
  "banki": "Banki komercyjne, spółdzielcze i hipoteczne, SKOK-i, firmy pożyczkowe, faktoringowe i windykacyjne. Nie zaliczamy: operatorów płatności, systemów kartowych, fintechów z kontem w aplikacji i brokerów inwestycyjnych (Fintech i płatności), ubezpieczycieli (Ubezpieczenia).",
  "ubezpieczenia": "Towarzystwa ubezpieczeń majątkowych i życiowych, reasekuracja oraz doradztwo ubezpieczeniowe. Nie zaliczamy: banków komercyjnych i spółdzielczych (Banki), platform płatniczych i fintechów (Fintech i płatności).",
  "transport": "Przewoźnicy pasażerscy (linie lotnicze, kolej, autokary), firmy kurierskie i logistyczne, operatorzy pocztowi, wynajem i współdzielenie aut oraz usługi taxi i ride-hailing. Nie zaliczamy: producentów pojazdów i części, naczep i nadwozi (Motoryzacja), biur podróży i platform rezerwacji (Turystyka i podróże).",
  "elektronika": "Produkcja fizycznego sprzętu RTV, komputerów i laptopów, smartfonów, podzespołów elektronicznych, kabli, sprzętu audio i wideo, automatyki domowej, systemów oświetleniowych, opraw LED oraz lamp. Hardware. Nie zaliczamy: sprzętu AGD (AGD), elektronarzędzi (Dom i ogród), oprogramowania (IT-Technologie), dystrybutorów i marketów z elektroniką (Handel).",
  "moda": "Producenci i właściciele marek odzieżowych, obuwniczych, galanterii skórzanej (torby, paski, portfele), bielizny i biżuterii. Nie zaliczamy: marek sportowych i outdoorowych (Sport i fitness), odzieży dziecięcej (Dzieci i zabawki), multibrandowych sklepów odzieżowych i obuwniczych sprzedających wiele marek (Handel).",
  "motoryzacja": "Producenci pojazdów silnikowych (samochody, ciężarówki, autobusy, motocykle), części i podzespołów samochodowych, naczep, nadwozi, maszyn rolniczych, pojazdów specjalnych oraz opon i ogumienia. Nie zaliczamy: rowerów (Sport i fitness), salonów samochodowych i komisów (Handel), chemii samochodowej np. płynów do spryskiwaczy (Chemia), oprogramowania do pojazdów np. systemów ADAS i infotainment (IT-Technologie).",
  "farmacja": "Producenci leków na receptę (Rx) i bez recepty (OTC), suplementów diety, wyrobów medycznych, sprzętu szpitalnego i laboratoryjnego, produktów weterynaryjnych. Nie zaliczamy: odżywek dla sportowców (Sport i fitness), dermokosmetyków pielęgnacyjnych (Kosmetyki), sieci aptek (Handel).",
  "zdrowie": "Prywatne placówki medyczne, sieci klinik, laboratoria diagnostyczne, salony optyczne i słuchowe, usługi opieki zdrowotnej i rehabilitacji oraz producenci artykułów higienicznych. Nie zaliczamy: kart sportowych i klubów fitness (Sport i fitness), producentów leków i wyrobów medycznych (Farmacja), sieci aptek (Handel).",
  "gastronomia": "Sieci restauracji, kawiarnie, cukiernie, lodziarnie, punkty szybkiej obsługi (fast food), catering dietetyczny oraz platformy pośredniczące w zamawianiu i dostawie posiłków. Nie zaliczamy: hoteli (Turystyka i podróże), producentów gotowych produktów spożywczych (Żywność), marketów i sklepów spożywczych (Handel).",
  "budownictwo": "Generalni wykonawcy, deweloperzy mieszkaniowi i komercyjni, producenci materiałów budowlanych (cegły, beton, stal, okna, drzwi, ceramika, wyposażenie łazienek), biura projektowe i pracownie architektoniczne. Nie zaliczamy: chemii budowlanej jak farby i kleje (Chemia), wyposażenia wnętrz (Meble), marketów budowlanych i narzędzi (Dom i ogród).",
  "meble": "Producenci mebli domowych, biurowych, ogrodowych, materacy i elementów wyposażenia wnętrz (tekstylia, dywany). Nie zaliczamy: lamp i opraw oświetleniowych (Elektronika), sklepów meblowych sprzedających wiele marek (Handel), marek artykułów do domu i dekoracji (Dom i ogród), producentów okien i drzwi (Budownictwo).",
};

const argv = process.argv.slice(2);
const zapis = argv.includes("--zapisz");
const przywroc = argv.includes("--przywroc") ? argv[argv.indexOf("--przywroc") + 1] : null;

if (przywroc) {
  const kopia = JSON.parse(fs.readFileSync(przywroc, "utf8"));
  let ok = 0;
  for (const f of kopia.firmy) {
    const w = await aktualizuj("companies", f.id, { category_id: f.category_id, category_slug: f.category_slug });
    if (w.blad) console.log(`BŁĄD ${f.slug}: ${w.blad}`); else ok++;
  }
  for (const k of kopia.kategorie) await aktualizuj("categories", k.id, { description: k.description });
  console.log(`Przywrócono ${ok}/${kopia.firmy.length} firm i opisy ${kopia.kategorie.length} kategorii. Nowe kategorie zostają w bazie (puste) - usuń je ręcznie, jeśli trzeba.`);
  process.exit(0);
}

const { dane: kategorie } = await odczyt("categories?select=*&order=name");
const firmy = await wszystkieFirmyPelne();
const kat = Object.fromEntries(kategorie.map((k) => [k.id, k]));
const poSlugu = Object.fromEntries(firmy.map((f) => [f.slug, f]));

// Walidacja: każda firma istnieje i występuje tylko raz; opisywane kategorie istnieją.
const bledy = [];
const widziane = new Set();
for (const n of NOWE) for (const s of n.firmy) {
  if (!poSlugu[s]) bledy.push(`brak firmy: ${s}`);
  if (widziane.has(s)) bledy.push(`firma dwa razy: ${s}`);
  widziane.add(s);
}
for (const s of Object.keys(OPISY)) if (!kategorie.some((k) => k.slug === s)) bledy.push(`brak kategorii: ${s}`);
if (bledy.length) { console.log(bledy.join("\n")); process.exit(1); }

for (const n of NOWE) {
  const istnieje = kategorie.find((k) => k.slug === n.slug);
  console.log(`\n${istnieje ? "=" : "+"} ${n.name} (${n.slug}) - ${n.firmy.length} firm`);
  for (const s of n.firmy) console.log(`   ${s.padEnd(30)} z: ${kat[poSlugu[s].category_id]?.name || "(brak)"}`);
}
const ruch = {};
for (const n of NOWE) for (const s of n.firmy) { const z = kat[poSlugu[s].category_id]?.name || "(brak)"; ruch[z] = (ruch[z] || 0) + 1; }
console.log("\nUbytek w dotychczasowych kategoriach:", ruch);
console.log(`Opisy do zmiany: ${Object.keys(OPISY).join(", ")}`);

if (!zapis) { console.log("\nDry-run. Zapis: --zapisz"); process.exit(0); }

const katalogKopii = path.join(KATALOG_REPO, "data", "robocze", "backup");
fs.mkdirSync(katalogKopii, { recursive: true });
const plikKopii = path.join(katalogKopii, `kategorie-przed-reorganizacja-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`);
fs.writeFileSync(plikKopii, JSON.stringify({
  firmy: firmy.map((f) => ({ id: f.id, slug: f.slug, category_id: f.category_id, category_slug: f.category_slug })),
  kategorie: kategorie.map((k) => ({ id: k.id, slug: k.slug, description: k.description })),
}, null, 1));
console.log(`\nKopia: ${plikKopii}`);

let przeniesione = 0;
for (const n of NOWE) {
  let k = kategorie.find((x) => x.slug === n.slug);
  if (!k) {
    const w = await wstaw("categories", { name: n.name, slug: n.slug, icon: n.icon, description: n.description });
    if (w.blad) { console.log(`BŁĄD kategorii ${n.slug}: ${w.blad}`); process.exit(1); }
    k = w.dane;
    console.log(`+ kategoria ${n.name}`);
  }
  for (const s of n.firmy) {
    const w = await aktualizuj("companies", poSlugu[s].id, { category_id: k.id, category_slug: n.slug });
    if (w.blad) console.log(`BŁĄD ${s}: ${w.blad}`); else przeniesione++;
  }
}
for (const [slug, description] of Object.entries(OPISY)) {
  const k = kategorie.find((x) => x.slug === slug);
  const w = await aktualizuj("categories", k.id, { description });
  if (w.blad) console.log(`BŁĄD opisu ${slug}: ${w.blad}`);
}
console.log(`Przeniesiono ${przeniesione} firm, zaktualizowano ${Object.keys(OPISY).length} opisów.`);
