import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const domain = formData.get('domain') as string;

    if (!file || !domain) {
      return NextResponse.json({ error: 'Missing file or domain' }, { status: 400 });
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
      const oldFile = path.join(logosDir, `${domain}${oldExt}`);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
      }
    }

    // Save new file
    const newFilePath = path.join(logosDir, `${domain}${ext}`);
    fs.writeFileSync(newFilePath, buffer);

    return NextResponse.json({ success: true, message: `Zapisano ${domain}${ext}` });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
