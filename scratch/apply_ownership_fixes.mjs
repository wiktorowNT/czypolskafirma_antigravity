// Script to apply ownership_description audit fixes to Supabase
// Fixes ~31 companies identified in the ownership audit

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx > 0) env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ==========================================
// OWNERSHIP DESCRIPTION FIXES
// ==========================================
const ownershipFixes = [
  // === CATEGORY A: Artefakty tekstowe ===
  {
    slug: "Alior Bank",
    field: "ownership_description",
    value: "Alior Bank S.A. jest kontrolowany przez Grupę PZU (31,91% akcji). Największym udziałowcem jest PZU S.A. (Polska). Pozostałe pakiety należą do OFE/TFI. Kapitał banku uznaje się za polski."
  },
  {
    slug: "BOŚ",
    field: "ownership_description",
    value: "Kontrolę posiada Narodowy Fundusz Ochrony Środowiska i Gospodarki Wodnej (58,05% akcji). Pozostali akcjonariusze to głównie krajowe instytucje (PFR, Lasy Państwowe). Kapitał jest polski."
  },

  // === SGB: artefakt "20" w BUSINESS_description ===
  {
    slug: "SGB",
    field: "business_description",
    value: "Bank zrzeszający ponad 180 banków spółdzielczych w ramach Spółdzielczej Grupy Bankowej. Zapewnia infrastrukturę technologiczną i wsparcie finansowe dla zrzeszonych banków, które świadczą usługi detaliczne i korporacyjne w lokalnych społecznościach."
  },

  // === CATEGORY B: Zbyt lakoniczne ===
  {
    slug: "aldesa",
    field: "ownership_description",
    value: "Hiszpańska firma budowlana przejęta przez chiński państwowy koncern China Railway Construction Corporation (CRCC). CRCC posiada pełną kontrolę nad grupą Aldesa."
  },
  {
    slug: "atlas-ward",
    field: "ownership_description",
    value: "Polska firma budowlana po wykupie menedżerskim. Właścicielami są polscy menedżerowie z zarządu spółki. Przedsiębiorstwo ze 100% polskim kapitałem prywatnym."
  },
  {
    slug: "hochtief",
    field: "ownership_description",
    value: "Niemiecka firma budowlana Hochtief AG, kontrolowana przez hiszpański koncern ACS Group (Actividades de Construcción y Servicios). ACS posiada ponad 75% akcji Hochtief. Ostatecznym beneficjentem jest hiszpański przedsiębiorca Florentino Pérez."
  },
  {
    slug: "mirbud",
    field: "ownership_description",
    value: "Polska spółka giełdowa notowana na GPW. Założyciel i prezes Jerzy Mirgos posiada pakiet kontrolny, zapewniający mu większość głosów na WZA. Przedsiębiorstwo ze 100% polskim kapitałem."
  },
  {
    slug: "pekabex",
    field: "ownership_description",
    value: "Polska spółka giełdowa notowana na GPW. Pakiet kontrolny posiada polski inwestor Maciej Grabski, który sprawuje efektywną kontrolę nad grupą. Przedsiębiorstwo z dominującym polskim kapitałem prywatnym."
  },
  {
    slug: "torpol",
    field: "ownership_description",
    value: "Spółka giełdowa notowana na GPW. Głównym akcjonariuszem jest CPK sp. z o.o. (podmiot Skarbu Państwa), który przejął pakiet kontrolny w ramach konsolidacji branży kolejowej. Pośrednio kontrolowana przez polski Skarb Państwa."
  },
  {
    slug: "modecom",
    field: "ownership_description",
    value: "Przedsiębiorstwo ze 100% polskim kapitałem prywatnym."
  },

  // === CATEGORY C: Info biznesowe w ownership ===
  {
    slug: "lechpol",
    field: "ownership_description",
    value: "Przedsiębiorstwo ze 100% polskim kapitałem prywatnym. Firma założona w 1990 r. przez Zbigniewa Leszka w Garwolinie; od 2015 r. prowadzona przez jego synów jako firma rodzinna."
  },
  {
    slug: "Lycamobile",
    field: "ownership_description",
    value: "Lycamobile to marka globalnej grupy Lyca Group, której właścicielem (98% udziałów) jest Subaskaran Allirajah – obywatel brytyjski lankijskiego pochodzenia. Spółka holdingowa Salinasco Holdings Limited jest zarejestrowana w Wielkiej Brytanii."
  },
  {
    slug: "MDD",
    field: "ownership_description",
    value: "Polska firma rodzinna z siedzibą w Sępólnie Krajeńskim (woj. kujawsko-pomorskie). Prezesem zarządu jest Michał Wiktor Dąbrowski, współzałożycielami są Jarosław Dąbrowski i Zbigniew Jan Mattya. Przedsiębiorstwo ze 100% polskim kapitałem prywatnym."
  },
  {
    slug: "Benix",
    field: "ownership_description",
    value: "Polska firma rodzinna założona w 1993 r. w Mroczeniu (powiat kępiński). Właścicielami są członkowie rodziny Kaczorowskich (m.in. Bernard Kaczorowski, Damian Jan Kaczorowski). Przedsiębiorstwo ze 100% polskim kapitałem prywatnym."
  },
  {
    slug: "Balma",
    field: "ownership_description",
    value: "Polska firma rodzinna założona w 1978 r. przez Ryszarda Balcerkiewicza z siedzibą w Tarnowie Podgórnym pod Poznaniem. Od 2005 r. prezesem jest syn założyciela, Michał Balcerkiewicz. Przedsiębiorstwo ze 100% polskim kapitałem prywatnym."
  },
  {
    slug: "Profim",
    field: "ownership_description",
    value: "Polska marka krzeseł biurowych, przejęta w 2018 r. przez norweską Grupę Flokk. Flokk jest kontrolowany przez Triton Partners — europejski fundusz private equity z siedzibą operacyjną w Londynie i strukturą partnerską w Jersey."
  },
  {
    slug: "colgate-palmolive",
    field: "ownership_description",
    value: "Amerykańska spółka publiczna notowana na NYSE. Akcjonariat silnie rozproszony, zdominowany przez instytucje finansowe (Vanguard, BlackRock, State Street). Brak pojedynczego akcjonariusza kontrolnego."
  },

  // === CATEGORY D: Niespójności stylistyczne ===
  {
    slug: "la-rive",
    field: "ownership_description",
    value: "Przedsiębiorstwo ze 100% polskim kapitałem prywatnym. Największymi udziałowcami są założyciele Piotr Szostak oraz Mariusz Szymula."
  },
  {
    slug: "ASTA-NET",
    field: "ownership_description",
    value: "Przedsiębiorstwo ze 100% polskim kapitałem prywatnym. Właścicielem kontrolnym jest Zbigniew Ryczek."
  },
  {
    slug: "apple",
    field: "ownership_description",
    value: "Amerykańska korporacja technologiczna notowana na NASDAQ. Akcjonariat rozproszony, z dominacją amerykańskich funduszy instytucjonalnych (Vanguard, BlackRock)."
  },
  {
    slug: "panasonic",
    field: "ownership_description",
    value: "Japońska korporacja notowana na giełdzie w Osace (dawniej Matsushita Electric). Akcjonariat rozproszony wśród japońskich instytucji finansowych."
  },
  {
    slug: "sony",
    field: "ownership_description",
    value: "Japońska korporacja technologiczna (Sony Group Corporation) notowana na giełdach w Tokio i Nowym Jorku. Akcjonariat rozproszony wśród instytucji finansowych."
  },
  {
    slug: "samsung",
    field: "ownership_description",
    value: "Południowokoreański koncern (chaebol) kontrolowany przez rodzinę Lee. Samsung Electronics jest notowany na giełdzie w Seulu, a rodzina Lee sprawuje efektywną kontrolę poprzez sieć powiązań krzyżowych w ramach Grupy Samsung."
  },
  {
    slug: "tcl",
    field: "ownership_description",
    value: "Chiński koncern elektroniczny notowany na giełdach w Shenzhen i Hongkongu. Założyciel Li Dongsheng sprawuje kontrolę nad firmą, z istotnym udziałem chińskich instytucji państwowych w akcjonariacie."
  },
  {
    slug: "xiaomi",
    field: "ownership_description",
    value: "Chińska korporacja technologiczna notowana na giełdzie w Hongkongu. Założyciel Lei Jun sprawuje efektywną kontrolę dzięki akcjom uprzywilejowanym z wielokrotnymi prawami głosu."
  },
  {
    slug: "lg",
    field: "ownership_description",
    value: "Południowokoreański chaebol kontrolowany przez rodzinę Koo. LG Electronics jest częścią grupy LG Corp, notowanej na giełdzie w Seulu."
  },
  {
    slug: "beko",
    field: "ownership_description",
    value: "Marka należy do tureckiego koncernu Arçelik A.Ş., kontrolowanego przez Koç Holding. Rodzina Koç sprawuje efektywną kontrolę nad holdingiem."
  },
  {
    slug: "yope",
    field: "ownership_description",
    value: "Przedsiębiorstwo ze 100% polskim kapitałem prywatnym. Właścicielami są założyciele: Karolina Kuklińska-Kosowicz i Paweł Kosowicz."
  },
];

// Also fix remaining business_description issues found during ownership audit
const businessFixes = [
  // Fix remaining ownership info leaks found during this audit
  {
    slug: "komputronik",
    value: "Jeden z najstarszych polskich dystrybutorów sprzętu IT i elektroniki użytkowej. Firma oferuje sprzedaż detaliczną oraz kompleksowe usługi integratorskie dla biznesu i administracji."
  },
  {
    slug: "mckb",
    value: "Łódzki generalny wykonawca realizujący obiekty przemysłowe, magazynowe i użyteczności publicznej. Firma stawia na kompleksową obsługę inwestycji od projektu po wykonawstwo."
  },
  {
    slug: "mirbud",
    value: "Jedna z największych polskich firm budowlanych, realizująca kontrakty drogowe i kubaturowe. Posiada własną masę bitumiczną i zaplecze sprzętowe, co pozwala na samodzielną realizację dużych zadań infrastrukturalnych."
  },
  {
    slug: "mostostal-warszawa",
    value: "Jedna z najstarszych firm budowlanych w Polsce, specjalizująca się w budownictwie ogólnym i inżynieryjnym. Realizuje kluczowe inwestycje energetyczne i infrastrukturalne na terenie całego kraju."
  },
  {
    slug: "mostostal-zabrze",
    value: "Przedsiębiorstwo inżynieryjne realizujące skomplikowane konstrukcje stalowe i instalacje przemysłowe. Działa globalnie, dostarczając rozwiązania dla energetyki i przemysłu ciężkiego."
  },
  {
    slug: "ndi",
    value: "Polska grupa budowlana realizująca projekty kubaturowe, infrastrukturalne oraz hydrotechniczne. Firma posiada wieloletnie doświadczenie w budownictwie morskim i portowym."
  },
  {
    slug: "pekabex",
    value: "Czołowy polski producent prefabrykatów żelbetowych dla budownictwa przemysłowego i mieszkaniowego. Firma działa również jako generalny wykonawca, wykorzystując własne zakłady produkcyjne do realizacji kompleksowych projektów."
  },
  {
    slug: "polimex-mostostal",
    value: "Polska grupa inżynieryjno-budowlana działająca w sektorach energetyki, chemii i paliw. Pełni rolę generalnego wykonawcy strategicznych bloków energetycznych i instalacji przemysłowych w Polsce."
  },
  {
    slug: "torpol",
    value: "Lider w zakresie modernizacji i budowy infrastruktury kolejowej oraz sieci trakcyjnych. Firma posiada kluczowe kompetencje w budowie linii dużych prędkości i nowoczesnych systemów kolejowych."
  },
  {
    slug: "trakcja",
    value: "Specjalistyczna firma wykonawcza dla sektora kolejowego, zajmująca się budową torowisk, sieci trakcyjnej i infrastruktury elektroenergetycznej dla kolei."
  },
  {
    slug: "nasz-sklep",
    value: "Franczyzowa sieć sklepów spożywczych, której celem jest konsolidacja tradycyjnego handlu i zapewnienie niezależnym kupcom konkurencyjnych warunków dostaw, wsparcia logistycznego i marketingowego."
  },
  {
    slug: "polomarket",
    value: "Jedna z największych polskich sieci supermarketów. Sklepy POLOmarket koncentrują się na ofercie świeżych produktów, współpracy z lokalnymi dostawcami i zapewnieniu wygodnych zakupów blisko domu."
  },
  {
    slug: "x-kom",
    value: "Czołowy polski sprzedawca elektroniki użytkowej, komputerów i podzespołów, wywodzący się ze sprzedaży internetowej. Firma słynie z fachowego doradztwa, silnej społeczności technologicznej i szybkiej dostawy."
  },
  {
    slug: "zabka",
    value: "Największa sieć sklepów typu convenience w Polsce, działająca w modelu franczyzowym. Firma wykorzystuje zaawansowane technologie AI do optymalizacji oferty, zapewniając szybkie zakupy blisko domu."
  },
  {
    slug: "morele",
    value: "Platforma e-commerce, która wyewoluowała ze sklepu komputerowego w marketplace z szerokim asortymentem. Oferuje elektronikę, zabawki, sprzęt sportowy i produkty do domu, łącząc sprzedaż online z szybką logistyką."
  },
  {
    slug: "media-expert",
    value: "Jedna z największych sieci elektromarketów w Polsce, znana z intensywnego marketingu i szerokiej dostępności, w tym w mniejszych miastach. Oferuje pełen asortyment RTV, AGD, IT i telekomunikacji."
  },
  {
    slug: "media-markt",
    value: "Międzynarodowa sieć marketów z elektroniką użytkową, działająca w modelu omnikanałowym. Oferuje szeroki wybór sprzętu RTV/AGD, komputerów, telefonów oraz usługi dodatkowe, takie jak serwis i ubezpieczenia."
  },
  {
    slug: "rtv-euro-agd",
    value: "Jedna z pierwszych i największych sieci ze sprzętem elektronicznym w Polsce. Firma łączy sprzedaż w salonach stacjonarnych z silnym sklepem internetowym, oferując pełen asortyment RTV, AGD i IT."
  },
  {
    slug: "top-market",
    value: "Sieć supermarketów integrująca niezależnych polskich kupców pod wspólnym szyldem. Zapewnia wsparcie logistyczne, marketingowe i handlowe, umożliwiając małym sklepom skuteczne konkurowanie na rynku."
  },
  {
    slug: "porr",
    value: "Międzynarodowy koncern budowlany realizujący projekty w zakresie budownictwa ogólnego, inżynieryjnego i infrastrukturalnego. Specjalizuje się w drogach, tunelach i obiektach kubaturowych na rynkach europejskich."
  },
  {
    slug: "roverpol",
    value: "Spółka inżynieryjna realizująca projekty w sektorze budownictwa morskiego, kolejowego i hydrotechnicznego. Specjalizuje się w dużych kontraktach infrastrukturalnych, w tym w budowie nabrzeży i obiektów portowych."
  },
  {
    slug: "eurovia",
    value: "Firma specjalizująca się w budownictwie drogowym i infrastrukturze transportowej, produkująca własne kruszywa i mieszanki asfaltowe. Realizuje duże kontrakty publiczne oraz inwestycje samorządowe w całym kraju."
  },
  {
    slug: "lidl",
    value: "Międzynarodowa sieć dyskontów spożywczych, koncentrująca się na markach własnych wysokiej jakości i świeżych produktach. Firma dynamicznie rozwija sieć placówek, oferując starannie dobrany asortyment w konkurencyjnych cenach."
  },
  {
    slug: "lewiatan",
    value: "Największa w Polsce sieć franczyzowa zrzeszająca niezależnych właścicieli sklepów spożywczych. Lewiatan zapewnia przedsiębiorcom siłę zakupową, centralną logistykę i rozpoznawalny szyld."
  },
  {
    slug: "murapol",
    value: "Jeden z najaktywniejszych deweloperów mieszkaniowych w Polsce, działający w segmencie popularnym i premium. Posiada zintegrowany model biznesowy, własną sieć sprzedaży i działa jednocześnie w kilkunastu miastach."
  },
];

async function applyFixes() {
  console.log(`\n🔧 Applying ${ownershipFixes.length} ownership_description fixes...\n`);
  
  let success = 0;
  let failed = 0;
  const errors = [];

  for (const fix of ownershipFixes) {
    const field = fix.field || 'ownership_description';
    const { data, error } = await supabase
      .from('companies')
      .update({ [field]: fix.value })
      .eq('slug', fix.slug)
      .select('slug');

    if (error) {
      console.log(`  ❌ ${fix.slug} (${field}): ${error.message}`);
      errors.push({ slug: fix.slug, error: error.message });
      failed++;
    } else if (data && data.length > 0) {
      console.log(`  ✅ ${fix.slug} (${field})`);
      success++;
    } else {
      console.log(`  ⚠️  ${fix.slug}: No matching row`);
      errors.push({ slug: fix.slug, error: 'No matching row' });
      failed++;
    }
  }

  console.log(`\n📊 Ownership fixes: ${success} updated, ${failed} failed out of ${ownershipFixes.length}\n`);

  // Now fix remaining business_description issues found during this audit
  console.log(`🔧 Applying ${businessFixes.length} remaining business_description fixes...\n`);
  
  let bSuccess = 0;
  let bFailed = 0;

  for (const fix of businessFixes) {
    const { data, error } = await supabase
      .from('companies')
      .update({ business_description: fix.value })
      .eq('slug', fix.slug)
      .select('slug');

    if (error) {
      console.log(`  ❌ ${fix.slug}: ${error.message}`);
      bFailed++;
    } else if (data && data.length > 0) {
      console.log(`  ✅ ${fix.slug}`);
      bSuccess++;
    } else {
      console.log(`  ⚠️  ${fix.slug}: No matching row`);
      bFailed++;
    }
  }

  console.log(`\n📊 Business fixes: ${bSuccess} updated, ${bFailed} failed out of ${businessFixes.length}`);
  console.log(`\n✅ TOTAL: ${success + bSuccess} updated, ${failed + bFailed} failed out of ${ownershipFixes.length + businessFixes.length}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Failed updates:');
    for (const e of errors) console.log(`   - ${e.slug}: ${e.error}`);
  }
}

applyFixes();
