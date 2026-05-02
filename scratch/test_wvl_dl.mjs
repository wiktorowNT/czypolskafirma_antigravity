import https from 'https';

https.get('https://worldvectorlogo.com/download/amica.svg', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk.toString('utf8'));
  res.on('end', () => {
    // The download page might have a link to the raw SVG or the raw SVG itself is somewhere
    const m = data.match(/href="([^"]+\.svg)"/g);
    console.log(m);
    
    // Also log if there's any cloudflare or redirect meta tag
    if (data.includes('http-equiv="refresh"')) {
        console.log('Redirecting meta tag:', data.match(/url=([^"]+)/i));
    }
  });
});
