// Script to apply all audit fixes to Supabase business_description
// Fixes ~57 companies identified in the Claude Opus audit

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local manually
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx > 0) env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// All fixes grouped by slug
const fixes = [
  // === CATEGORY A: Remove ownership info from business_description ===
  {
    slug: "aldesa",
    desc: "Generalny wykonawca inwestycji infrastrukturalnych, energetycznych i kubaturowych. Firma realizuje projekty budowlane z zakresu dróg, mostów i obiektów przemysłowych na rynkach europejskich."
  },
  {
    slug: "arhelan",
    desc: "Dynamicznie rozwijająca się sieć supermarketów działająca głównie w północno-wschodniej Polsce. Firma powstała w Bielsku Podlaskim i skutecznie konkuruje z zagranicznymi sieciami, oferując bogaty wybór świeżych produktów i marek lokalnych."
  },
  {
    slug: "atal",
    desc: "Ogólnopolski deweloper mieszkaniowy, realizujący inwestycje wielorodzinne w największych miastach. Firma samodzielnie zarządza całym procesem inwestycyjnym, od projektu po wykonawstwo, co zapewnia kontrolę jakości na każdym etapie budowy."
  },
  {
    slug: "atlas-ward",
    desc: "Lider w budowie wielkopowierzchniowych parków logistycznych i magazynowych. Firma realizuje inwestycje w modelu \"zaprojektuj i wybuduj\", dostarczając nowoczesne obiekty magazynowe i przemysłowe."
  },
  {
    slug: "chata-polska",
    desc: "Polska sieć sklepów spożywczych rozwijana w modelu franczyzowym, działająca głównie w zachodniej Polsce. Firma stawia na bliskie relacje z klientami i lokalnymi dostawcami, oferując świeże produkty w przystępnych cenach."
  },
  {
    slug: "delikatesy-centrum",
    desc: "Franczyzowa sieć sklepów spożywczych, wspierająca lokalnych przedsiębiorców poprzez centralną logistykę i marketing. Model biznesowy opiera się na partnerskim współdziałaniu z niezależnymi kupcami, zapewniając im konkurencyjne warunki dostaw."
  },
  {
    slug: "elektrotim",
    desc: "Firma inżynieryjna wykonująca instalacje elektryczne i systemy automatyki dla przemysłu i wojska. Specjalizuje się w sieciach elektroenergetycznych oraz systemach bezpieczeństwa."
  },
  {
    slug: "erbud",
    desc: "Jedna z największych polskich grup budowlanych, działająca w segmencie kubaturowym, inżynieryjnym i serwisowym. Dynamicznie rozwija działalność w sektorze OZE, budując farmy wiatrowe i fotowoltaiczne."
  },
  {
    slug: "eurovia",
    desc: "Firma specjalizująca się w budownictwie drogowym i infrastrukturze transportowej, produkująca własne kruszywa i mieszanki asfaltowe. Realizuje duże kontrakty publiczne oraz inwestycje samorządowe w całym kraju."
  },
  {
    slug: "fb-antczak",
    desc: "Deweloper i generalny wykonawca z ponad 40-letnią tradycją na rynku polskim. Realizuje inwestycje mieszkaniowe, przemysłowe oraz obiekty użyteczności publicznej."
  },
  {
    slug: "komputronik",
    desc: "Jeden z najstarszych polskich dystrybutorów sprzętu IT i elektroniki użytkowej. Firma oferuje sprzedaż detaliczną oraz kompleksowe usługi integratorskie dla biznesu i administracji."
  },
  {
    slug: "lewiatan",
    desc: "Największa w Polsce sieć franczyzowa zrzeszająca niezależnych właścicieli sklepów spożywczych. Lewiatan zapewnia przedsiębiorcom siłę zakupową, centralną logistykę i rozpoznawalny szyld."
  },
  {
    slug: "media-expert",
    desc: "Jedna z największych sieci elektromarketów w Polsce, znana z intensywnego marketingu i szerokiej dostępności, w tym w mniejszych miastach. Oferuje pełen asortyment RTV, AGD, IT i telekomunikacji."
  },
  {
    slug: "media-markt",
    desc: "Międzynarodowa sieć marketów z elektroniką użytkową, działająca w modelu omnikanałowym. Oferuje szeroki wybór sprzętu RTV/AGD, komputerów, telefonów oraz usługi dodatkowe, takie jak serwis i ubezpieczenia."
  },
  {
    slug: "mirbud",
    desc: "Jedna z największych polskich firm budowlanych, realizująca kontrakty drogowe i kubaturowe. Posiada własną masę bitumiczną i zaplecze sprzętowe, co pozwala na samodzielną realizację dużych zadań infrastrukturalnych."
  },
  {
    slug: "morele",
    desc: "Platforma e-commerce, która wyewoluowała ze sklepu komputerowego w marketplace z szerokim asortymentem. Oferuje elektronikę, zabawki, sprzęt sportowy i produkty do domu, łącząc sprzedaż online z szybką logistyką."
  },
  {
    slug: "mostostal-warszawa",
    desc: "Jedna z najstarszych firm budowlanych w Polsce, specjalizująca się w budownictwie ogólnym i inżynieryjnym. Realizuje kluczowe inwestycje energetyczne i infrastrukturalne na terenie całego kraju."
  },
  {
    slug: "mostostal-zabrze",
    desc: "Przedsiębiorstwo inżynieryjne realizujące skomplikowane konstrukcje stalowe i instalacje przemysłowe. Działa globalnie, dostarczając rozwiązania dla energetyki i przemysłu ciężkiego."
  },
  {
    slug: "murapol",
    desc: "Jeden z najaktywniejszych deweloperów mieszkaniowych w Polsce, działający w segmencie popularnym i premium. Posiada zintegrowany model biznesowy, własną sieć sprzedaży i działa jednocześnie w kilkunastu miastach."
  },
  {
    slug: "nasz-sklep",
    desc: "Franczyzowa sieć sklepów spożywczych, której celem jest konsolidacja tradycyjnego handlu i zapewnienie niezależnym kupcom konkurencyjnych warunków dostaw, wsparcia logistycznego i marketingowego."
  },
  {
    slug: "ndi",
    desc: "Polska grupa budowlana realizująca projekty kubaturowe, infrastrukturalne oraz hydrotechniczne. Firma posiada wieloletnie doświadczenie w budownictwie morskim i portowym."
  },
  {
    slug: "pekabex",
    desc: "Czołowy polski producent prefabrykatów żelbetowych dla budownictwa przemysłowego i mieszkaniowego. Firma działa również jako generalny wykonawca, wykorzystując własne zakłady produkcyjne do realizacji kompleksowych projektów."
  },
  {
    slug: "polimex-mostostal",
    desc: "Polska grupa inżynieryjno-budowlana działająca w sektorach energetyki, chemii i paliw. Pełni rolę generalnego wykonawcy strategicznych bloków energetycznych i instalacji przemysłowych w Polsce."
  },
  {
    slug: "polomarket",
    desc: "Jedna z największych polskich sieci supermarketów. Sklepy POLOmarket koncentrują się na ofercie świeżych produktów, współpracy z lokalnymi dostawcami i zapewnieniu wygodnych zakupów blisko domu."
  },
  {
    slug: "porr",
    desc: "Międzynarodowy koncern budowlany realizujący projekty w zakresie budownictwa ogólnego, inżynieryjnego i infrastrukturalnego. Specjalizuje się w drogach, tunelach i obiektach kubaturowych na rynkach europejskich."
  },
  {
    slug: "roverpol",
    desc: "Spółka inżynieryjna realizująca projekty w sektorze budownictwa morskiego, kolejowego i hydrotechnicznego. Specjalizuje się w dużych kontraktach infrastrukturalnych, w tym w budowie nabrzeży i obiektów portowych."
  },
  {
    slug: "rtv-euro-agd",
    desc: "Jedna z pierwszych i największych sieci ze sprzętem elektronicznym w Polsce. Firma łączy sprzedaż w salonach stacjonarnych z silnym sklepem internetowym, oferując pełen asortyment RTV, AGD i IT."
  },
  {
    slug: "top-market",
    desc: "Sieć supermarketów integrująca niezależnych polskich kupców pod wspólnym szyldem. Zapewnia wsparcie logistyczne, marketingowe i handlowe, umożliwiając małym sklepom skuteczne konkurowanie na rynku."
  },
  {
    slug: "torpol",
    desc: "Lider w zakresie modernizacji i budowy infrastruktury kolejowej oraz sieci trakcyjnych. Firma posiada kluczowe kompetencje w budowie linii dużych prędkości i nowoczesnych systemów kolejowych."
  },
  {
    slug: "trakcja",
    desc: "Specjalistyczna firma wykonawcza dla sektora kolejowego, zajmująca się budową torowisk, sieci trakcyjnej i infrastruktury elektroenergetycznej dla kolei."
  },
  {
    slug: "x-kom",
    desc: "Czołowy polski sprzedawca elektroniki użytkowej, komputerów i podzespołów, wywodzący się ze sprzedaży internetowej. Firma słynie z fachowego doradztwa, silnej społeczności technologicznej i szybkiej dostawy."
  },
  {
    slug: "zabka",
    desc: "Największa sieć sklepów typu convenience w Polsce, działająca w modelu franczyzowym. Firma wykorzystuje zaawansowane technologie AI do optymalizacji oferty, zapewniając szybkie zakupy blisko domu."
  },
  {
    slug: "mckb",
    desc: "Łódzki generalny wykonawca realizujący obiekty przemysłowe, magazynowe i użyteczności publicznej. Firma stawia na kompleksową obsługę inwestycji od projektu po wykonawstwo."
  },
  {
    slug: "gulermak",
    desc: "Koncern inżynieryjny specjalizujący się w budowie metra i tuneli metodą TBM. W Polsce znany z realizacji drugiej linii metra w Warszawie oraz tunelu w Świnoujściu."
  },

  // === CATEGORY B: Too generic / banal descriptions ===
  {
    slug: "Alior Bank",
    desc: "Innowacyjny bank uniwersalny, który od momentu powstania wyróżnia się na rynku dynamicznym wdrażaniem nowych technologii. Oferuje szeroką gamę produktów dla klientów indywidualnych i firmowych, w tym kredyty, lokaty oraz zaawansowaną bankowość mobilną."
  },
  {
    slug: "BFF",
    desc: "Instytucja finansowa specjalizująca się w usługach faktoringu i finansowaniu należności od podmiotów publicznych. Oferuje firmom faktoring pełny, dyskontowanie faktur oraz inne rozwiązania poprawiające płynność finansową."
  },
  {
    slug: "Bank Pocztowy",
    desc: "Bank komercyjny oferujący usługi finansowe klientom indywidualnym oraz mikro- i małym przedsiębiorstwom. Wyróżnia się szeroką dostępnością dzięki działaniu poprzez placówki Poczty Polskiej, oferując standardowe usługi detaliczne, takie jak rachunki, karty, kredyty i lokaty."
  },
  {
    slug: "BNP Paribas",
    desc: "Bank uniwersalny obsługujący zróżnicowaną grupę klientów – od osób indywidualnych po duże korporacje. Oferuje konta osobiste, kredyty hipoteczne i konsumpcyjne, produkty inwestycyjne, a dla firm – rachunki, leasing, faktoring i bankowość transakcyjną."
  },
  {
    slug: "BOŚ",
    desc: "Bank specjalizujący się w finansowaniu przedsięwzięć proekologicznych, takich jak termomodernizacja, OZE, gospodarka odpadami czy oczyszczanie ścieków. Oferuje również standardowe usługi bankowe dla klientów indywidualnych i biznesowych."
  },
  {
    slug: "BPS",
    desc: "Centrala zrzeszająca sieć banków spółdzielczych, oferująca wspólnie z nimi szeroki zakres usług finansowych dla klientów indywidualnych, firm, samorządów i rolników. Zapewnia infrastrukturę bankową i wsparcie technologiczne dla lokalnych instytucji finansowych."
  },
  {
    slug: "Pekao",
    desc: "Jeden z największych i najstarszych banków w Polsce, obsługujący zarówno klientów indywidualnych, jak i korporacyjnych. Oferuje pełną gamę produktów bankowych – od rachunków i kart, przez kredyty hipoteczne, po zaawansowane usługi bankowości inwestycyjnej i zarządzania aktywami."
  },
  {
    slug: "PKO BP",
    desc: "Największy bank w Polsce, obsługujący miliony klientów indywidualnych i tysięcy firm. Oferuje pełną gamę produktów bankowości detalicznej i korporacyjnej, nowoczesne usługi cyfrowe (aplikacja IKO) oraz bankowość inwestycyjną."
  },
  {
    slug: "Plus Bank",
    desc: "Bank detaliczny wyspecjalizowany w kredytach konsumenckich. Oferuje głównie kredyty gotówkowe, hipoteczne, lokaty terminowe oraz podstawowe rachunki osobiste dla klientów indywidualnych i małych firm."
  },
  {
    slug: "SGB",
    desc: "Bank zrzeszający ponad 180 banków spółdzielczych w ramach Spółdzielczej Grupy Bankowej. Zapewnia infrastrukturę technologiczną i wsparcie finansowe dla zrzeszonych banków, które świadczą usługi detaliczne i korporacyjne w lokalnych społecznościach."
  },
  {
    slug: "Inbank",
    desc: "Estoński bank cyfrowy oferujący usługi depozytowe i kredytowe poprzez platformę internetową. Specjalizuje się w atrakcyjnych lokatach terminowych oraz finansowaniu zakupów ratalnych, działając wyłącznie w kanale online."
  },
  {
    slug: "Raiffeisen",
    desc: "Austriacki bank komercyjny z silną pozycją w Europie Środkowo-Wschodniej. W Polsce oferuje usługi bankowości korporacyjnej, trade finance oraz produkty skarbowe dla dużych przedsiębiorstw i instytucji finansowych."
  },
  {
    slug: "Santander",
    desc: "Jeden z największych banków komercyjnych w Polsce, obsługujący miliony klientów indywidualnych i firm. Oferuje szeroką gamę produktów finansowych, w tym kredyty hipoteczne, bankowość mobilną, leasing i usługi inwestycyjne."
  },
  {
    slug: "UniCredit",
    desc: "Włoski bank komercyjny działający w Polsce poprzez oddział, specjalizujący się w bankowości korporacyjnej i inwestycyjnej. Obsługuje duże przedsiębiorstwa i instytucje, oferując finansowanie strukturalne, trade finance i usługi rynku kapitałowego."
  },
  {
    slug: "mBank",
    desc: "Pionier bankowości internetowej w Polsce, znany z innowacyjnej aplikacji mobilnej i nowoczesnego podejścia do usług finansowych. Oferuje pełną gamę produktów bankowych dla klientów indywidualnych i korporacyjnych, w tym kredyty, oszczędności i usługi inwestycyjne."
  },

  // === CATEGORY C: Factual errors ===
  {
    slug: "ghelamco",
    desc: "Międzynarodowy deweloper komercyjny specjalizujący się w projektowaniu i budowie prestiżowych wieżowców biurowych. Firma słynie z realizacji ikonicznych budynków, łączących nowoczesną architekturę z najwyższymi standardami zrównoważonego budownictwa."
  },
  {
    slug: "lidl",
    desc: "Międzynarodowa sieć dyskontów spożywczych, koncentrująca się na markach własnych wysokiej jakości i świeżych produktach. Firma dynamicznie rozwija sieć placówek, oferując starannie dobrany asortyment w konkurencyjnych cenach."
  },
  {
    slug: "Bayer",
    desc: "Globalny koncern farmaceutyczno-chemiczny. Dział farmaceutyczny produkuje leki kardiologiczne, ginekologiczne i onkologiczne. Dział konsumencki oferuje znane marki jak Aspirin i Bepanthen. Koncern jest również jednym z czołowych dostawców rozwiązań dla rolnictwa."
  },
];

async function applyFixes() {
  console.log(`\n🔧 Applying ${fixes.length} business_description fixes...\n`);
  
  let success = 0;
  let failed = 0;
  const errors = [];

  for (const fix of fixes) {
    const { data, error } = await supabase
      .from('companies')
      .update({ business_description: fix.desc })
      .eq('slug', fix.slug)
      .select('slug, name');

    if (error) {
      console.log(`  ❌ ${fix.slug}: ${error.message}`);
      errors.push({ slug: fix.slug, error: error.message });
      failed++;
    } else if (data && data.length > 0) {
      console.log(`  ✅ ${fix.slug}`);
      success++;
    } else {
      console.log(`  ⚠️  ${fix.slug}: No matching row found (slug mismatch?)`);
      errors.push({ slug: fix.slug, error: 'No matching row' });
      failed++;
    }
  }

  console.log(`\n📊 Results: ${success} updated, ${failed} failed out of ${fixes.length} total`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Failed updates:');
    for (const e of errors) {
      console.log(`   - ${e.slug}: ${e.error}`);
    }
  }
}

applyFixes();
