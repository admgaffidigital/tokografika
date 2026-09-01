const fs = require('fs');
const path = require('path');
const https = require('https');

const LOGO_URL = "https://drive.google.com/thumbnail?id=1GKiWINvFovkvKXAwPHMDigP-XpXpRweK&sz=w800";
const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download image: status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', err => {
      reject(err);
    });
  });
}

async function syncLogo() {
  const tempPath = path.join(publicDir, 'favicon.png');
  console.log('📥 Downloading official header logo from Google Drive...');
  await downloadFile(LOGO_URL, tempPath);
  
  // Copy to all icon destinations
  fs.copyFileSync(tempPath, path.join(publicDir, 'icon-512.png'));
  fs.copyFileSync(tempPath, path.join(publicDir, 'icon-192.png'));
  fs.copyFileSync(tempPath, path.join(publicDir, 'logo.png'));

  fs.copyFileSync(tempPath, path.join(distDir, 'favicon.png'));
  fs.copyFileSync(tempPath, path.join(distDir, 'icon-512.png'));
  fs.copyFileSync(tempPath, path.join(distDir, 'icon-192.png'));
  fs.copyFileSync(tempPath, path.join(distDir, 'logo.png'));

  // Remove the static SVG so browser uses the high-res PNG logo
  const svgPublic = path.join(publicDir, 'favicon.svg');
  const svgDist = path.join(distDir, 'favicon.svg');
  if (fs.existsSync(svgPublic)) fs.unlinkSync(svgPublic);
  if (fs.existsSync(svgDist)) fs.unlinkSync(svgDist);

  console.log('✅ Official header logo synced to public and dist folders successfully!');
}

syncLogo().catch(err => {
  console.error('❌ Error syncing logo:', err);
});
