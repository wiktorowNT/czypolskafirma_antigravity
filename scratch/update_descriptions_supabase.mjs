import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const updates = [
  { slug: "philips", desc: "Holenderski gigant technologiczny i lider innowacji w dziedzinie ochrony zdrowia oraz oświetlenia. Portfolio marki obejmuje zaawansowany sprzęt medyczny, a także popularne produkty konsumenckie, takie jak szczoteczki soniczne Sonicare, golarki oraz oświetlenie Hue." },
  { slug: "pepsico", desc: "Jeden z największych na świecie producentów napojów i przekąsek, obecny w ponad 200 krajach. Firma jest właścicielem kultowych marek, takich jak Pepsi, Lay's, Doritos, Cheetos, 7UP oraz mrożonej herbaty Lipton Ice Tea." },
  { slug: "leclerc", desc: "Francuska sieć hipermarketów i supermarketów, działająca jako stowarzyszenie niezależnych przedsiębiorców. Firma oferuje szeroki wybór produktów spożywczych i przemysłowych, kładąc duży nacisk na konkurencyjne ceny oraz rozwój marek własnych." },
  { slug: "michelin", desc: "Francuski gigant i jeden z największych na świecie producentów opon do samochodów, motocykli oraz maszyn rolniczych i lotniczych. Marka jest globalnym symbolem jakości, znanym również z wydawania legendarnych przewodników kulinarnych i map turystycznych." },
  { slug: "toyota", desc: "Japoński koncern motoryzacyjny, światowy lider w produkcji samochodów i prekursor technologii hybrydowej. Firma słynie z legendarnej niezawodności swoich pojazdów oraz pionierskich prac nad napędami wodorowymi i nowoczesną mobilnością." },
  { slug: "volkswagen", desc: "Niemiecki gigant motoryzacyjny i jeden z największych producentów samochodów na świecie. Koncern oferuje pełną gamę pojazdów – od aut miejskich i rodzinnych, przez luksusowe marki premium (Audi, Porsche), po nowoczesne samochody elektryczne z serii ID." },
  { slug: "auchan", desc: "Francuska sieć handlowa obecna na wielu rynkach świata, specjalizująca się w formacie hipermarketów i supermarketów. Firma oferuje tysiące produktów 'pod jednym dachem', rozwijając jednocześnie nowoczesne kanały sprzedaży internetowej i marki własne." },
  { slug: "carrefour", desc: "Jeden z globalnych liderów handlu detalicznego, prowadzący hipermarkety, supermarkety oraz sklepy osiedlowe. Marka promuje zdrowe odżywianie i produkty ekologiczne, oferując szeroki asortyment spożywczy oraz przemysłowy w formacie stacjonarnym i online." },
  { slug: "kaufland", desc: "Europejska sieć nowoczesnych marketów spożywczo-przemysłowych, kładąca nacisk na dużą powierzchnię sprzedaży i szerokość asortymentu. Firma oferuje bogaty wybór produktów świeżych, marki własne oraz towary od regionalnych dostawców w atrakcyjnych cenach." },
  { slug: "aldi", desc: "Międzynarodowa sieć sklepów spożywczych, która zrewolucjonizowała handel wprowadzając format dyskontu. Firma koncentruje się na starannie dobranym asortymencie produktów wysokiej jakości w niskich cenach, promując prostotę i efektywność zakupów." },
  { slug: "nestle", desc: "Największa na świecie firma z branży spożywczej, oferująca produkty w niemal każdej kategorii żywienia. Do najbardziej znanych marek koncernu należą m.in. Nescafé, Nesquik, KitKat, Lion, a także popularne w Polsce przyprawy i dania gotowe Winiary." },
  { slug: "danone", desc: "Międzynarodowy producent żywności, koncentrujący się na produktach wspierających zdrowy styl życia. Firma jest światowym liderem w kategorii produktów mlecznych (Danio, Activia), wód mineralnych (Żywiec Zdrój, Evian) oraz żywności dla niemowląt (Nutricia)." },
  { slug: "loreal", desc: "Największy na świecie koncern kosmetyczny, oferujący pełną gamę produktów do makijażu, pielęgnacji cery i włosów oraz perfum. W portfolio firmy znajdują się marki rozpoznawalne na całym świecie, m.in. L'Oréal Paris, Garnier, Maybelline oraz Vichy." },
  { slug: "henkel", desc: "Niemiecki koncern chemiczny i kosmetyczny, lider w kategoriach środków piorących, pielęgnacji włosów oraz klejów. Marka dostarcza znane produkty codziennego użytku, takie jak Persil, Perwoll, Schwarzkopf, Syoss oraz kleje Pattex i Loctite." },
  { slug: "ikea", desc: "Szwedzki gigant meblowy i światowy lider w urządzaniu wnętrz. Firma słynie z demokratycznego designu, oferując funkcjonalne, estetyczne i przystępne cenowo meble oraz akcesoria do domu, które użytkownicy mogą samodzielnie montować." },
  { slug: "castorama", desc: "Największa w Polsce i jedna z wiodących w Europie sieci marketów typu DIY (zrób to sam). Firma oferuje kompleksowe rozwiązania do budowy, remontu, urządzania wnętrz oraz pielęgnacji ogrodów, skierowane do klientów indywidualnych i profesjonalistów." },
  { slug: "leroy-merlin", desc: "Francuska sieć marketów budowlano-dekoracyjnych, oferująca szeroki wybór materiałów budowlanych, narzędzi oraz elementów wyposażenia wnętrz i ogrodu. Marka wspiera klientów w realizacji projektów domowych, od fundamentów aż po dekoracje." },
  { slug: "decathlon", desc: "Międzynarodowa sieć sklepów oraz producent sprzętu i odzieży sportowej dla niemal każdej dyscypliny. Firma słynie z tworzenia innowacyjnych marek własnych, takich jak Quechua, Kalenji czy Tribord, które łączą wysoką jakość z przystępną ceną." },
  { slug: "allegro", desc: "Największa platforma zakupowa w Polsce i jedna z największych firm e-commerce w Europie. Allegro to ekosystem handlowy łączący miliony kupujących z setkami tysięcy sprzedawców, oferujący niemal nieograniczony wybór produktów, własne usługi płatnicze i logistyczne." },
  { slug: "inpost", desc: "Europejski lider logistyki dla e-commerce, który zrewolucjonizował rynek dzięki sieci Paczkomatów. Firma oferuje nowoczesne, ekologiczne i wygodne usługi kurierskie oraz systemy automatycznego odbioru i nadawania przesyłek dostępne 24/7." },
  { slug: "budimex", desc: "Największa grupa budowlana w Polsce, realizująca strategiczne inwestycje w obszarze infrastruktury drogowej, kolejowej oraz budownictwa ogólnego i przemysłowego. Firma pełni rolę generalnego wykonawcy najbardziej wymagających projektów inżynieryjnych w kraju." },
  { slug: "skanska", desc: "Globalna firma budowlana i deweloperska, będąca liderem w tworzeniu zrównoważonych i nowoczesnych przestrzeni biurowych oraz mieszkaniowych. Marka słynie z wdrażania innowacyjnych technologii ekologicznych oraz dbałości o najwyższe standardy bezpieczeństwa i designu." },
  { slug: "strabag", desc: "Jeden z czołowych koncernów budowlanych w Europie, specjalizujący się w budownictwie drogowym, kolejowym oraz inżynierii wodnej. Firma posiada własną sieć wytwórni mas bitumicznych, co pozwala na kompleksową realizację największych projektów infrastrukturalnych." },
  { slug: "warbud", desc: "Renomowana firma budowlana specjalizująca się w realizacji skomplikowanych obiektów użyteczności publicznej, medycznych oraz przemysłowych. Przedsiębiorstwo dysponuje unikalnym doświadczeniem w zakresie inżynierii specjalistycznej i zaawansowanych konstrukcji żelbetowych." },
  { slug: "hochtief", desc: "Międzynarodowa grupa budowlana o zasięgu globalnym, realizująca prestiżowe projekty z zakresu budownictwa kubaturowego i infrastruktury. Firma specjalizuje się w budowie nowoczesnych biurowców, centrów logistycznych oraz obiektów przemysłowych najwyższej klasy." },
  { slug: "kajima", desc: "Jedna z najstarszych i najbardziej doświadczonych firm budowlanych na świecie, wywodząca się z Japonii. Specjalizuje się w projektowaniu i realizacji zaawansowanych technologicznie obiektów przemysłowych, magazynowych oraz biurowych w formule 'projektuj i buduj'." },
  { slug: "makro", desc: "Wiodąca sieć samoobsługowych hurtowni, dedykowana głównie dla przedsiębiorców oraz branży gastronomicznej i hotelarskiej (HoReCa). Firma oferuje profesjonalny asortyment spożywczy i przemysłowy, a także nowoczesne systemy dystrybucji i doradztwa biznesowego." },
  { slug: "selgros", desc: "Międzynarodowa sieć hurtowni samoobsługowych, będąca jednym z największych partnerów dla handlu detalicznego i gastronomii. Oferuje kompleksowe zaopatrzenie w produkty świeże, spożywcze oraz artykuły przemysłowe, wspierając klientów biznesowych w ich codziennej działalności." },
  { slug: "spar", desc: "Jedna z największych na świecie sieci dobrowolnego zrzeszania niezależnych handlowców detalicznych. Marka oferuje formaty od małych sklepów osiedlowych po duże hipermarkety, stawiając na świeże produkty, lokalne dostawy oraz wysoką jakość obsługi klienta." },
  { slug: "netto", desc: "Europejska sieć dyskontów spożywczych, koncentrująca się na formacie sklepów osiedlowych. Firma oferuje szeroki wybór produktów codziennego użytku, marki własne oraz świeży asortyment w konkurencyjnych cenach, zapewniając wygodę szybkich zakupów." },
  { slug: "stokrotka", desc: "Ogólnopolska sieć nowoczesnych supermarketów i marketów spożywczych, znana z gęstej sieci lokalizacji blisko klienta. Firma stawia na bogatą ofertę produktów świeżych, mięs i wędlin oraz atrakcyjne programy lojalnościowe dla stałych klientów." },
  { slug: "biedronka", desc: "Największa sieć detaliczna w Polsce, będąca liderem rynku dyskontów spożywczych. Marka słynie ze strategii niskich cen, bogatej oferty marek własnych oraz gęstej sieci sklepów, które każdego dnia odwiedzają miliony Polaków." },
  { slug: "platinet", desc: "Producent i dystrybutor elektroniki użytkowej oraz nośników pamięci. Marka oferuje szeroką gamę akcesoriów komputerowych, sprzętu audio oraz urządzeń mobilnych łączących nowoczesny design z funkcjonalnością." },
  { slug: "maxcom", desc: "Producent urządzeń telekomunikacyjnych, specjalizujący się w telefonach komórkowych o wysokiej ergonomii, w tym modelach dedykowanych dla seniorów. Portfolio marki obejmuje również smartfony, krótkofalówki oraz innowacyjne akcesoria mobilne." },
  { slug: "bremer", desc: "Niemiecka grupa budowlana specjalizująca się w prefabrykacji konstrukcji żelbetowych oraz kompleksowej realizacji hal przemysłowych i logistycznych. Firma słynie z wysokiej efektywności procesów budowlanych i dostarczania nowoczesnych obiektów biurowych pod klucz." },
  { slug: "dom-development", desc: "Wiodący deweloper mieszkaniowy, znany z realizacji prestiżowych osiedli i apartamentowców w największych aglomeracjach. Firma kładzie duży nacisk na jakość architektury, zagospodarowanie zieleni oraz tworzenie przyjaznych przestrzeni do życia." },
  { slug: "eurocash", desc: "Lider hurtowej dystrybucji produktów FMCG oraz organizator największych sieci franczyzowych w Polsce. Grupa dostarcza innowacyjne rozwiązania dla handlu detalicznego, wspierając konkurencyjność tysięcy niezależnych sklepów spożywczych." },
  { slug: "Fresenius Kabi", desc: "Globalna firma farmaceutyczna specjalizująca się w lekach ratujących życie i technologiach medycznych do infuzji, transfuzji oraz żywienia klinicznego. Przedsiębiorstwo jest kluczowym dostawcą dla szpitali i ośrodków opieki zdrowotnej." },
  { slug: "USP Zdrowie", desc: "Czołowy producent i dystrybutor leków bez recepty (OTC) oraz suplementów diety. Marka jest właścicielem wielu rozpoznawalnych produktów wspierających zdrowie i odporność, dostępnych w aptekach oraz szerokiej sieci sprzedaży." },
  { slug: "adamietz", desc: "Specjalistyczna grupa budowlana koncentrująca się na generalnym wykonawstwie obiektów przemysłowych, hal i magazynów. Firma posiada własne zakłady produkcji konstrukcji stalowych, co pozwala na pełną kontrolę jakości i terminowości realizacji." },
  { slug: "alstal", desc: "Polska grupa budowlana specjalizująca się w generalnym wykonawstwie skomplikowanych obiektów sportowych, basenów oraz infrastruktury o specjalnym przeznaczeniu. Firma słynie z solidności i doświadczenia w realizacji wymagających projektów inżynieryjnych." },
  { slug: "Animex Foods", desc: "Największa w Polsce firma mięsna, producent wyrobów wędliniarskich z wieprzowiny i drobiu. Marka jest właścicielem kultowych brandów takich jak Krakus i Morliny, oferując produkty oparte na tradycyjnych recepturach i nowoczesnych standardach jakości." },
  { slug: "Millennium", desc: "Ogólnopolski bank uniwersalny oferujący kompleksowe usługi finansowe dla klientów indywidualnych oraz firm. Marka słynie z wysokiej jakości obsługi, nowoczesnej bankowości mobilnej oraz szerokiej gamy produktów oszczędnościowych i kredytowych." },
  { slug: "Canal+", desc: "Wiodąca platforma telewizji satelitarnej i streamingowej, oferująca bogaty wybór kanałów premium, filmów, seriali oraz prestiżowych transmisji sportowych. Marka jest również producentem własnych, nagradzanych treści telewizyjnych i kinowych." },
  { slug: "Cedrob", desc: "Lider polskiego rynku drobiarskiego, prowadzący zintegrowany łańcuch produkcji 'od pola do stołu'. Firma specjalizuje się w produkcji wysokiej jakości mięsa drobiowego oraz pasz, będąc jednym z największych eksporterów w swojej branży." },
  { slug: "cfe", desc: "Międzynarodowy generalny wykonawca realizujący zaawansowane projekty w budownictwie przemysłowym, biurowym i mieszkaniowym. Firma wykorzystuje innowacyjne technologie inżynieryjne, zapewniając najwyższe standardy realizacji inwestycji kubaturowych." },
  { slug: "Com40", desc: "Wielkoseryjny producent mebli tapicerowanych, dostarczający gotowe sofy i systemy wypoczynkowe na rynki globalne. Firma dysponuje jednym z najnowocześniejszych parków maszynowych w Europie, produkując miliony jednostek mebli rocznie." },
  { slug: "dekpol", desc: "Holding budowlano-deweloperski aktywny w obszarze budownictwa przemysłowego, kubaturowego oraz produkcji konstrukcji stalowych. Firma realizuje kompleksowe projekty od etapu projektowania po generalne wykonawstwo i sprzedaż mieszkań." },
  { slug: "develia", desc: "Dynamicznie rozwijający się deweloper realizujący inwestycje mieszkaniowe, biurowe i komercyjne. Marka skupia się na tworzeniu nowoczesnych osiedli i obiektów komercyjnych w kluczowych lokalizacjach największych polskich miast." },
  { slug: "duna", desc: "Firma budowlana specjalizująca się w realizacji strategicznych kontraktów drogowych, mostowych i inżynieryjnych. Przedsiębiorstwo realizuje kluczowe inwestycje infrastrukturalne, opierając się na wieloletnim doświadczeniu i nowoczesnym zapleczu technicznym." },
  { slug: "goldbeck", desc: "Lider nowoczesnego budownictwa systemowego, oferujący hale produkcyjne i magazynowe budowane z optymalizowanych elementów gotowych. Innowacyjny system prefabrykacji pozwala firmie na błyskawiczną realizację trwałych i funkcjonalnych obiektów przemysłowych." },
  { slug: "Grupa Maspex", desc: "Jeden z największych w Europie Środkowo-Wschodniej producentów żywności, soków i napojów. Marka jest właścicielem takich brandów jak Tymbark, Kubuś, Lubella, Łowicz, Kotlin oraz DecoMorreno." },
  { slug: "Halmar", desc: "Projektant i dystrybutor mebli oferujący szeroki asortyment wyposażenia dla domów i biur. Portfolio marki obejmuje nowoczesne stoły, krzesła, meble pokojowe oraz sypialniane, łączące aktualne trendy z funkcjonalnością." },
  { slug: "Hilding Anders", desc: "Wiodący producent materacy i łóżek, specjalizujący się w tworzeniu rozwiązań wspierających zdrowy i komfortowy sen. Marka oferuje szeroką gamę materacy piankowych i sprężynowych oraz stelaży, dopasowanych do indywidualnych potrzeb użytkowników." },
  { slug: "Signal", desc: "Dystrybutor mebli do domów i biur, znany z oferowania produktów o nowoczesnej stylistyce skandynawskiej i loftowej. Marka dostarcza szeroki wybór łóżek, foteli, stołów i krzeseł, które wyróżniają się ciekawym designem i atrakcyjną ceną." },
  { slug: "intercor", desc: "Specjalistyczna firma inżynieryjna będąca liderem w budowie mostów, wiaduktów oraz estakad na kluczowych szlakach komunikacyjnych. Przedsiębiorstwo posiada potężne własne zaplecze sprzętowe, umożliwiające realizację najbardziej wymagających obiektów inżynierskich." },
  { slug: "karmar", desc: "Uznana spółka budowlana realizująca projekty mieszkaniowe, biurowe oraz użyteczności publicznej. Jako doświadczony generalny wykonawca, firma stawia na partnerstwo w procesie inwestycyjnym i najwyższą jakość wykonania detali architektonicznych." }
];

async function updateCompany(id, desc) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ business_description: desc })
    }
  );
  return res.ok;
}

async function main() {
  console.log(`Starting update of ${updates.length} company descriptions...`);
  
  // First, fetch all IDs for these slugs to be safe
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,slug`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  
  if (!res.ok) throw new Error("Failed to fetch companies for ID mapping");
  const allCompanies = await res.json();
  const slugToId = Object.fromEntries(allCompanies.map(c => [c.slug, c.id]));

  let successCount = 0;
  let failCount = 0;

  for (const update of updates) {
    const id = slugToId[update.slug];
    if (!id) {
      console.warn(`Could not find ID for slug: ${update.slug}`);
      failCount++;
      continue;
    }

    const success = await updateCompany(id, update.desc);
    if (success) {
      console.log(`Updated: ${update.slug}`);
      successCount++;
    } else {
      console.error(`Failed: ${update.slug}`);
      failCount++;
    }
  }

  console.log(`\nUpdate finished!`);
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

main().catch(console.error);
