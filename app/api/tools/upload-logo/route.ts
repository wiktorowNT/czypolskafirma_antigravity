import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Narzędzie lokalne (Logo Fixer): zapisuje pliki do public/logos, więc na produkcji
// endpoint nie istnieje (działa tylko pod npm run dev).
const MAX_BYTES = 5 * 1024 * 1024;
const SVG_DANGER = /<script|\bon[a-z]+\s*=|javascript:|<foreignObject|<iframe|<embed|<object/i;

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    let domainInput = (formData.get('domain') as string || '').trim();
    
    // If user pasted a full URL, extract only the domain
    let domain = domainInput;
    if (domainInput.includes('://') || domainInput.includes('/')) {
      try {
        const urlString = domainInput.startsWith('http') ? domainInput : `https://${domainInput}`;
        const urlObj = new URL(urlString);
        domain = urlObj.hostname.replace(/^www\./, '');
      } catch (e) {
        // Fallback to basic cleaning if URL parsing fails
        domain = domainInput.replace(/\/+$/, '').replace(/^https?:\/\//, '').replace(/^www\./, '');
      }
    }

    if (!file || !domain) {
      return NextResponse.json({ error: 'Missing file or domain' }, { status: 400 });
    }

    // Sanitize domain to prevent path traversal
    const safeDomain = domain.replace(/[^a-zA-Z0-9.\-]/g, '');
    if (safeDomain !== domain || domain.includes('..')) {
      return NextResponse.json({ error: 'Invalid domain name' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Plik większy niż 5 MB' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Determine extension
    let ext = '.png';
    if (file.type.includes('svg') || file.name.endsWith('.svg')) ext = '.svg';
    else if (file.type.includes('jpeg') || file.name.endsWith('.jpg')) ext = '.jpg';
    else if (file.type.includes('webp') || file.name.endsWith('.webp')) ext = '.webp';

    if (ext === '.svg' && SVG_DANGER.test(buffer.toString('utf8'))) {
      return NextResponse.json({ error: 'SVG zawiera skrypty lub aktywne elementy' }, { status: 400 });
    }

    const logosDir = path.join(process.cwd(), 'public', 'logos');
    
    // Ensure directory exists
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    // Delete old files for this domain
    const extensions = ['.png', '.svg', '.jpg', '.jpeg', '.webp'];
    for (const oldExt of extensions) {
      const oldFile = path.join(logosDir, `${safeDomain}${oldExt}`);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
      }
    }

    // Save new file
    const newFilePath = path.join(logosDir, `${safeDomain}${ext}`);
    fs.writeFileSync(newFilePath, buffer);

    return NextResponse.json({ success: true, message: `Zapisano ${safeDomain}${ext}` });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
