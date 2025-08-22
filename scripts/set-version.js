#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getVersion() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    const pkg = require('../package.json');
    return pkg.version || '0.0.0';
  }
}

const version = getVersion();

const files = [
  'index.html',
  'sw.js',
  path.join('js', 'main.js'),
  path.join('js', 'radar-engine.js'),
];

files.forEach((file) => {
  const filePath = path.resolve(__dirname, '..', file);
  const data = fs.readFileSync(filePath, 'utf8');
  const result = data.replace(/__VERSION__/g, version);
  fs.writeFileSync(filePath, result);
});

console.log(`Applied version ${version} to ${files.length} files.`);
