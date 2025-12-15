async function getIds() {
    const companies = ["Komputronik", "Blik", "mBank", "Biedronka", "Auchan", "Pepco"];
    for (const company of companies) {
        try {
            const res = await fetch(`http://localhost:3000/api/companies/search?q=${company}`);
            const data = await res.json();
            if (data.length > 0) {
                console.log(`TYPE_ID:${company}:${data[0].id}`);
            } else {
                console.log(`TYPE_ID:${company}:NOT_FOUND`);
            }
        } catch (e) {
            console.log(`TYPE_ID:${company}:ERROR`);
        }
    }
}

getIds();
