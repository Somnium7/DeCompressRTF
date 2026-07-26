import { cp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import packageJson from './package.json' with { type: 'json' };
import tsconfigJson from './tsconfig.json' with { type: 'json' };

const exec = promisify(execCallback);

// build esm modules
await exec('npx tsc');

// backup
await forceCopy('package.json', 'package.json.bak');
await forceCopy('tsconfig.json', 'tsconfig.json.bak');

try {
  // update package.json and tsconfig.json
  await writeJson(
    'package.json',
    { ...packageJson, type: 'module' }
  );
  await writeJson(
    'tsconfig.json',
    { ...tsconfigJson, compilerOptions: { ...tsconfigJson.compilerOptions, module: 'commonjs' } }
  );

  // build commonjs
  await forceCopy('src/index.mts', 'src/index.cts');

  await exec('npx tsc');

} finally {
  // restore backup
  await forceCopy('package.json.bak', 'package.json');
  await forceCopy('tsconfig.json.bak', 'tsconfig.json');
}



async function forceCopy(src, dest) {
  await cp(
    join(import.meta.dirname, src),
    join(import.meta.dirname, dest),
    { force: true }
  );
}

async function writeJson(path, json) {
  await writeFile(
    join(import.meta.dirname, path),
    JSON.stringify(json, null, 2),
  );
}
