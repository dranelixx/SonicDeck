#!/usr/bin/env node
/**
 * Sync version from version.json to package.json, Cargo.toml, and tauri.conf.json
 * Run this script before building to ensure all version files are in sync
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read version from version.json
const versionFilePath = path.join(__dirname, '../version.json');
const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
const { version } = versionData;

if (!version) {
  console.error('❌ Error: No version found in version.json');
  process.exit(1);
}

console.log(`📦 Syncing version to: ${version}`);

// 1. Update package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = version;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ Updated package.json`);

// 2. Update src-tauri/Cargo.toml
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf-8');
cargoToml = cargoToml.replace(/version = "[\d.a-z-]+"/, `version = "${version}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log(`✅ Updated src-tauri/Cargo.toml`);

// 3. Update src-tauri/tauri.conf.json
const tauriConfPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
tauriConf.version = version;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log(`✅ Updated src-tauri/tauri.conf.json`);

console.log(`\n✨ Version sync complete: ${version}\n`);
