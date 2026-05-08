import fs from 'fs';

const companies = JSON.parse(fs.readFileSync('scratch/all_companies_audit.json', 'utf8'));

const badPatterns = [
  /spółka zależna/i,
  /spółka córka/i,
  /należy do/i,
  /własność/i,
  /kapitał/i,
  /akcjonariusz/i,
  /控股/i, // Just in case
  /zakład produkcyjny/i,
  /fabryka w/i,
  /odpowiedzialna za/i,
  /kluczowe procesy/i,
  /strategię handlową/i,
  /rządzi/i,
  /zarządza procesami/i,
  /oddział globalnego/i,
  /ramię/i
];

const audit = {
  empty: [],
  ownershipFocus: [],
  subsidiaryRoleFocus: [],
  corporateJargon: [],
  good: []
};

companies.forEach(c => {
  const desc = c.business_description || "";
  
  if (!desc.trim()) {
    audit.empty.push(c);
    return;
  }

  let isBad = false;
  
  // Ownership focus
  if (/spółka zależna|spółka córka|należy do|własność|kapitał|akcjonariusz|控股|centrali/i.test(desc)) {
    audit.ownershipFocus.push(c);
    isBad = true;
  }
  
  // Subsidiary role focus
  else if (/zakład produkcyjny|fabryka w|fabryki w|oddział|ramię|odpowiedzialna za|centrum usług/i.test(desc)) {
    audit.subsidiaryRoleFocus.push(c);
    isBad = true;
  }
  
  // Jargon
  else if (/procesy zakupowe|strategię handlową|omnikanał|format osiedlowy|konwergentne/i.test(desc)) {
    audit.corporateJargon.push(c);
    isBad = true;
  }
  
  if (!isBad) {
    audit.good.push(c);
  }
});

console.log("AUDIT SUMMARY");
console.log("=============");
console.log(`Total companies: ${companies.length}`);
console.log(`Empty descriptions: ${audit.empty.length}`);
console.log(`Ownership focus: ${audit.ownershipFocus.length}`);
console.log(`Subsidiary role focus: ${audit.subsidiaryRoleFocus.length}`);
console.log(`Corporate jargon: ${audit.corporateJargon.length}`);
console.log(`Likely good: ${audit.good.length}`);

console.log("\nEXAMPLES OF OWNERSHIP FOCUS:");
audit.ownershipFocus.slice(0, 10).forEach(c => console.log(`- ${c.name}: ${c.business_description}`));

console.log("\nEXAMPLES OF SUBSIDIARY ROLE:");
audit.subsidiaryRoleFocus.slice(0, 10).forEach(c => console.log(`- ${c.name}: ${c.business_description}`));

console.log("\nEXAMPLES OF CORPORATE JARGON:");
audit.corporateJargon.slice(0, 10).forEach(c => console.log(`- ${c.name}: ${c.business_description}`));

fs.writeFileSync('scratch/full_audit_report.json', JSON.stringify(audit, null, 2));
