const fs = require('fs');
const path = require('path');

const logosDir = path.join(__dirname, 'public', 'logos');
const files = fs.readdirSync(logosDir);

const logosData = {};

files.forEach(file => {
    if (file.match(/\.(png|jpg|jpeg|svg|webp)$/i)) {
        const filePath = path.join(logosDir, file);
        const ext = path.extname(file).toLowerCase().replace('.', '');
        const content = fs.readFileSync(filePath);
        const base64 = content.toString('base64');
        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
        logosData[file] = `data:${mimeType};base64,${base64}`;
    }
});

const output = `window.logosData = ${JSON.stringify(logosData, null, 2)};`;
fs.writeFileSync(path.join(__dirname, 'logos_bundle.js'), output);
console.log('Zapakowano ' + Object.keys(logosData).length + ' logotypów do logos_bundle.js');
