import https from 'https';

https.get('https://worldvectorlogo.com/logo/amica', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk.toString('utf8'));
  res.on('end', () => {
    // Find CDN links
    const links = data.match(/https:\/\/cdn\.worldvectorlogo\.com\/[^\"]+/g);
    console.log(links);
  });
});
