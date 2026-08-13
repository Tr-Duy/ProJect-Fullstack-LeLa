const fs = require('fs');
const lightMd = fs.readFileSync('d:/LeLa-Website/vercel design/design.md', 'utf8');
const darkMd = fs.readFileSync('d:/LeLa-Website/vercel design/design.dark.md', 'utf8');

function extractColors(md) {
  const match = md.match(/colors:\n([\s\S]*?)typography:/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const colors = {};
  for (const line of lines) {
    const m = line.match(/^\s+([\w-]+):\s*\"(#[0-9a-fA-F]+)\"/);
    if (m) {
      colors[m[1]] = m[2];
    }
  }
  return colors;
}

const lightColors = extractColors(lightMd);
const darkColors = extractColors(darkMd);

let rootCss = '\n/* Geist Design System Colors */\n:root {\n';
for (const [key, val] of Object.entries(lightColors)) {
  rootCss += `  --geist-${key}: ${val};\n`;
}
rootCss += '}\n\n.dark {\n';
for (const [key, val] of Object.entries(darkColors)) {
  rootCss += `  --geist-${key}: ${val};\n`;
}
rootCss += '}\n\n@theme {\n';
for (const key of Object.keys(lightColors)) {
  rootCss += `  --color-geist-${key}: var(--geist-${key});\n`;
}
rootCss += '}\n';

fs.appendFileSync('d:/LeLa-Website/LeLa-FE/src/index.css', rootCss);
console.log('Appended Geist colors to index.css');
