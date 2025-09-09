const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

// Determine version from git commit hash or fallback to timestamp
let version;
try {
  version = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  version = Date.now().toString();
}

const swTemplatePath = path.join(__dirname, '..', 'sw.js');
const distPath = path.join(__dirname, '..', 'dist');
const swDestPath = path.join(distPath, 'sw.js');

// Recursively grab all built asset file paths within dist
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const fullPath = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(fullPath) : [fullPath];
});

const assetFiles = fs.existsSync(distPath) ? walk(distPath) : [];
const assets = ['/', ...assetFiles
  .map(f => '/' + path.relative(distPath, f).replace(/\\/g, '/'))
  .filter(f => f !== '/sw.js')
];

let swSource = fs.readFileSync(swTemplatePath, 'utf8');
swSource = swSource
  .replace('__CACHE_VERSION__', version)
  .replace(/const ASSETS = \[[\s\S]*?\];/, `const ASSETS = [\n${assets.map(a => `  '${a}'`).join(',\n')}\n];`);

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}
fs.writeFileSync(swDestPath, swSource);
console.log(`Service worker generated with CACHE_VERSION=${version}, ${assets.length} assets cached.`);
