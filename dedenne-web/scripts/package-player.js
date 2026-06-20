const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Source: c:/antigravity/pet-link/custom-pet-player-extracted
const sourceDir = path.resolve(__dirname, '../../custom-pet-player-extracted');
// Destination: c:/antigravity/pet-link/dedenne-web/public/releases/custom-pet-player.zip
const outputZip = path.resolve(__dirname, '../public/releases/custom-pet-player.zip');

async function main() {
  const zip = new JSZip();

  function addFilesRecursively(dir, zipFolder) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      // Exclude development/run-time files that bloat the package
      if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'temp-check-zip' || file === 'temp-zip-extract') {
        continue;
      }
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const zipPath = path.join(zipFolder, file).replace(/\\/g, '/'); // Force forward slashes!

      if (stat.isDirectory()) {
        addFilesRecursively(filePath, zipPath);
      } else {
        const fileContent = fs.readFileSync(filePath);
        zip.file(zipPath, fileContent);
      }
    }
  }

  console.log(`Zipping files from: ${sourceDir}`);
  addFilesRecursively(sourceDir, 'pet-player');

  console.log('Generating ZIP content (deflated, level 9)...');
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  console.log(`Writing ZIP file to: ${outputZip}`);
  const destDir = path.dirname(outputZip);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.writeFileSync(outputZip, content);
  console.log('Successfully packaged custom player! 🎉');
}

main().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
