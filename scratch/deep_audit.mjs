import fs from 'fs';

const companies = JSON.parse(fs.readFileSync('scratch/all_companies_audit.json', 'utf8'));

const issues = [];

companies.forEach(c => {
  const desc = c.business_description || "";
  const name = c.name;
  const lowerDesc = desc.toLowerCase();
  
  const reasons = [];
  
  // 1. Subsidiary focus (Polish role)
  if (lowerDesc.includes("w polsce") && (lowerDesc.includes("oddział") || lowerDesc.includes("importer") || lowerDesc.includes("dystrybutor") || lowerDesc.includes("fabryka") || lowerDesc.includes("zakład") || lowerDesc.includes("reprezentuje") || lowerDesc.includes("odpowiada za"))) {
    reasons.push("Focuses on Polish subsidiary role");
  }
  
  if (lowerDesc.includes("odpowiedzialna za centralne zakupy") || lowerDesc.includes("strategię handlową") || lowerDesc.includes("zarządza procesami")) {
     reasons.push("Subsidiary function jargon");
  }

  // 2. Ownership/Capital focus
  if (lowerDesc.includes("należy do") || lowerDesc.includes("spółka zależna") || lowerDesc.includes("spółka córka") || lowerDesc.includes("większościowym akcjonariuszem") || lowerDesc.includes("kapitał") || lowerDesc.includes("własność rodziny")) {
    reasons.push("Ownership/Capital focus");
  }
  
  // 3. Importer/Distributor focus (usually means they are describing the local sales office)
  if (lowerDesc.startsWith("importer") || lowerDesc.startsWith("dystrybutor") || lowerDesc.startsWith("oddział")) {
    reasons.push("Starts with local role (importer/distributor/branch)");
  }

  if (reasons.length > 0) {
    issues.push({
      id: c.id,
      name: c.name,
      slug: c.slug,
      business_description: c.business_description,
      reasons: reasons
    });
  }
});

console.log(`Found ${issues.length} companies with potential description issues.`);
fs.writeFileSync('scratch/full_audit_issues.json', JSON.stringify(issues, null, 2));

// Group by reasons for report
const summary = {};
issues.forEach(i => {
  i.reasons.forEach(r => {
    summary[r] = (summary[r] || 0) + 1;
  });
});

console.log("\nIssue Summary:");
console.log(summary);

console.log("\nTOP 20 PROBLEMATIC DESCRIPTIONS:");
issues.slice(0, 20).forEach(i => {
  console.log(`[${i.slug}] ${i.name}`);
  console.log(`   DESC: ${i.business_description}`);
  console.log(`   WHY: ${i.reasons.join(", ")}`);
  console.log("");
});
