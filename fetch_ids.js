const fetch = require('node-fetch');

async function getIds() {
    const companies = ["Komputronik", "Blik", "Mbank", "Biedronka", "Auchan", "Pepco"];
    for (const company of companies) {
        const res = await fetch(`http://localhost:3000/api/companies/search?q=${company}`);
        const data = await res.json();
        if (data.length > 0) {
            console.log(`${company}: ${data[0].id}`);
        } else {
            console.log(`${company}: NOT FOUND`);
        }
    }
}

getIds();
