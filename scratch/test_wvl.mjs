async function test() {
  const r = await fetch('https://worldvectorlogo.com/search?q=amica');
  const t = await r.text();
  const links = [...t.matchAll(/href="([^"]+\/logo\/[^"]+)"/g)].map(m => m[1]);
  console.log('Links:', links);
}
test();
