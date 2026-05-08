import fs from 'fs';

const SUPABASE_URL = "https://bwciuhgrcibtjhhksjqk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y2l1aGdyY2lidGpoaGtzanFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5MDc2MCwiZXhwIjoyMDc0NTY2NzYwfQ.M6iXQ6b7Y0cMLLAMX1EAQHmy-o05Wr--mznYNyUFUbI";

const allCompanies = JSON.parse(fs.readFileSync('scratch/all_companies_audit.json', 'utf8'));

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
  let successCount = 0;
  let failCount = 0;

  for (const update of updates) {
    // Try to find by slug (case insensitive)
    let company = allCompanies.find(c => c.slug.toLowerCase() === update.slug.toLowerCase());
    
    // If not found, try to find by name (contains)
    if (!company) {
       company = allCompanies.find(c => c.name.toLowerCase().includes(update.slug.toLowerCase()));
    }

    if (!company) {
      console.warn(`Could not find company for: ${update.slug}`);
      failCount++;
      continue;
    }

    const success = await updateCompany(company.id, update.desc);
    if (success) {
      console.log(`Updated: ${company.slug} (${company.name})`);
      successCount++;
    } else {
      console.error(`Failed: ${company.slug}`);
      failCount++;
    }
  }

  console.log(`\nFinal pass finished!`);
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

main().catch(console.error);
