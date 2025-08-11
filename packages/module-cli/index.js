#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const [, , cmd, name] = process.argv;

function usage() {
  console.log('Usage: module-cli init <name>');
}

if (cmd !== 'init' || !name) {
  usage();
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), name);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

['api', 'schemas', 'events', 'tests'].forEach((folder) => {
  fs.mkdirSync(path.join(targetDir, folder), { recursive: true });
});

const manifest = {
  name,
  version: '1.0.0',
  endpoints: {},
  schemas: {},
  events: { publish: [], subscribe: [] }
};

fs.writeFileSync(
  path.join(targetDir, 'module.manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log(`Module '${name}' initialized at ${targetDir}`);

