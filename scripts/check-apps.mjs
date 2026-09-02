import { readdir, readFile } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const projects = (await readdir(root, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);
const apps = [];
for (const dir of projects) {
  try { await readFile(join(root, dir, 'package.json')); apps.push(dir); } catch {}
}
const selected = process.argv[2] ? [process.argv[2]] : apps;
if (selected.some(dir => !apps.includes(dir))) throw new Error('Unknown app directory.');
if (!process.env.npm_execpath) throw new Error('Run through npm run check:apps -- [app-directory].');
const packageManagerPath = process.env.npm_execpath;
const packageManagerIsBun = /^bun(?:\.exe)?$/i.test(basename(packageManagerPath));
const sentinel = 'IB_BUILD_ONLY_SECRET_SENTINEL_8e7bf045';
const env = { ...process.env, GEMINI_API_KEY: sentinel, VITE_GEMINI_API_KEY: sentinel,
  VITE_STRIPE_SECRET_KEY: sentinel, STRIPE_SECRET_KEY: sentinel,
  PRIVATE_DATA_KEYS_JSON:sentinel, REFERRAL_ABUSE_HMAC_KEY:sentinel,
  VITE_REFERRAL_ABUSE_HMAC_KEY:sentinel,
  VITE_FIREBASE_APPCHECK_SITE_KEY:'CI_PUBLIC_APPCHECK_SITE_KEY' };
async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { await inspect(path); continue; }
    if (/server\.(?:c?js|mjs)(?:\.map)?$/.test(entry.name)) throw new Error('Server artifact inside public output.');
    const bytes = await readFile(path);
    if (bytes.includes(Buffer.from(sentinel))) throw new Error('Provider credential leaked into browser output.');
  }
}
let failures = 0;
for (const app of selected) {
  try {
    for (const script of ['lint', 'build']) {
      const executable = packageManagerIsBun ? packageManagerPath : process.execPath;
      const args = packageManagerIsBun ? ['run', script] : [packageManagerPath, 'run', script];
      const run = spawnSync(executable, args, {
        cwd: resolve(root, app), env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
      });
      if (run.error || run.status !== 0) throw new Error(`${script} failed\n${run.stdout || ''}${run.stderr || ''}${run.error || ''}`);
      if (/empty-import-meta/.test(run.stderr || '')) throw new Error('Server contains unsupported import.meta in CommonJS.');
    }
    const pkg = JSON.parse(await readFile(join(root, app, 'package.json'), 'utf8'));
    await inspect(join(root, app, pkg.scripts.build.includes('dist/client') ? 'dist/client' : 'dist'));
    console.log(`PASS ${app}: typecheck, build, public-artifact/secret check`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${app}: ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
