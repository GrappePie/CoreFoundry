#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

function copyTemplate(targetDir, name) {
  const templateDir = path.resolve(__dirname, '../../templates/basic-module');
  fs.cpSync(templateDir, targetDir, { recursive: true });
  const manifestPath = path.join(targetDir, 'module.manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.name = name;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

yargs(hideBin(process.argv))
  .command(
    'create <name>',
    'Genera un módulo a partir de la plantilla básica',
    (y) => y.positional('name', { describe: 'Nombre del módulo', type: 'string' }),
    (argv) => {
      const targetDir = path.resolve(process.cwd(), argv.name);
      copyTemplate(targetDir, argv.name);
      console.log(`Módulo '${argv.name}' creado en ${targetDir}`);
    }
  )
  .command(
    'validate [dir]',
    'Valida el manifest de un módulo',
    (y) =>
      y.positional('dir', {
        describe: 'Directorio del módulo',
        type: 'string',
        default: process.cwd(),
      }),
    (argv) => {
      const moduleDir = path.resolve(process.cwd(), argv.dir);
      const manifestPath = path.join(moduleDir, 'module.manifest.json');
      if (!fs.existsSync(manifestPath)) {
        console.error('module.manifest.json no encontrado');
        process.exit(1);
      }
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (!manifest.name || !manifest.version) {
          throw new Error('Campos "name" y "version" requeridos');
        }
        console.log('Manifest válido');
      } catch (err) {
        console.error(`Manifest inválido: ${err.message}`);
        process.exit(1);
      }
    }
  )
  .command(
    'test [dir]',
    'Ejecuta los tests de un módulo',
    (y) =>
      y.positional('dir', {
        describe: 'Directorio del módulo',
        type: 'string',
        default: process.cwd(),
      }),
    (argv) => {
      const moduleDir = path.resolve(process.cwd(), argv.dir);
      const testsDir = path.join(moduleDir, 'tests');
      if (!fs.existsSync(testsDir)) {
        console.error('No se encontró el directorio de tests');
        process.exit(1);
      }
      const child = spawn('node', ['--test'], {
        cwd: testsDir,
        stdio: 'inherit',
        shell: true,
      });
      child.on('exit', (code) => process.exit(code));
    }
  )
  .demandCommand(1)
  .help().argv;
