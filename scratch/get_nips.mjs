const fs = require('fs');
const companies = [
  'Grupa Maspex', 'Mlekovita', 'Mlekpol', 'Animex Foods', 'Sokołów', 'Tarczyński', 'Nestlé Polska', 'Mondelez Polska',
  'Danone', 'Grupa Żywiec', 'Kompania Piwowarska', 'Carlsberg Polska', 'Ferrero Polska', 'Lotte Wedel', 'Wawel', 'Colian',
  'Hortex', 'Coca-Cola HBC Polska', 'PepsiCo', 'Cedrob', 'OSM Piątnica', 'Polmlek', 'Zott Polska', 'Hochland Polska',
  'Mars Polska', 'Krajowa Grupa Spożywcza', 'Bakoma', 'FoodCare', 'Mokate', 'Prymat', 'Dawtona', 'Indykpol', 'Iglotex',
  'Oshee', 'Pamapol', 'SuperDrob', 'Mieszko', 'Koral', 'OSM Krasnystaw', 'Nutricia Polska'
];

async function getNip(company) {
  try {
    const res = await fetch('https://rejestr.io/szukaj?q=' + encodeURIComponent(company));
    const text = await res.text();
    const match = text.match(/NIP:\s*(\d{10})/);
    return match ? match[1] : 'NIE ZNALEZIONO';
  } catch (err) {
    return 'BŁĄD';
  }
}

async function run() {
  for (const c of companies) {
    const nip = await getNip(c);
    console.log(`${c} | ${nip}`);
    await new Promise(r => setTimeout(r, 500));
  }
}
run();
