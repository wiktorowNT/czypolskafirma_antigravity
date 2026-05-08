import fs from 'fs';
const audit = JSON.parse(fs.readFileSync('scratch/full_audit_report.json', 'utf8'));

console.log("SAMPLING 'GOOD' DESCRIPTIONS:");
audit.good.slice(100, 120).forEach(c => console.log(`- ${c.name}: ${c.business_description}`));
