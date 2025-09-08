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

const swSource = fs.readFileSync(swTemplatePath, 'utf8');
const result = swSource.replace('__CACHE_VERSION__', version);

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}
fs.writeFileSync(swDestPath, result);
console.log(`Service worker generated with CACHE_VERSION=${version}`);
