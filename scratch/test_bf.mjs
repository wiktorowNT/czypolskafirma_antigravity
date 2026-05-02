import puppeteer from 'puppeteer';

async function test() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const response = await page.goto('https://brandfetch.com/calzedonia.com', { waitUntil: 'networkidle2' });
  console.log('Status:', response.status());
  
  const content = await page.content();
  if (content.includes('cloudflare') || content.includes('challenge')) {
    console.log('Cloudflare detected!');
  } else {
    console.log('Page loaded successfully!');
    // Find image with src containing cdn.brandfetch.io
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src.includes('asset.brandfetch.io'));
    });
    console.log('Images:', images);
  }
  
  await browser.close();
}
test();
