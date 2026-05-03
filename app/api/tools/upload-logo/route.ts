import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

export async function POST(req: NextRequest) {
  // Auth check — only allow requests with valid admin key
  const providedKey = req.headers.get('x-admin-key');
  if (!ADMIN_KEY || providedKey !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const domain = formData.get('domain') as string;

    if (!file || !domain) {
      return NextResponse.json({ error: 'Missing file or domain' }, { status: 400 });
    }

    // Sanitize domain to prevent path traversal
    const safeDomain = domain.replace(/[^a-zA-Z0-9.\-]/g, '');
    if (safeDomain !== domain || domain.includes('..')) {
      return NextResponse.json({ error: 'Invalid domain name' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Determine extension
    let ext = '.png';
    if (file.type.includes('svg') || file.name.endsWith('.svg')) ext = '.svg';
    else if (file.type.includes('jpeg') || file.name.endsWith('.jpg')) ext = '.jpg';
    else if (file.type.includes('webp') || file.name.endsWith('.webp')) ext = '.webp';

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
