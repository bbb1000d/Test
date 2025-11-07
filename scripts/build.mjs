import { mkdir, rm, readFile, writeFile, readdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function copyFile(src, dest) {
  const content = await readFile(src);
  await writeFile(dest, content);
}

async function copyFolder(src, dest) {
  await ensureDir(dest);
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = resolve(src, entry.name);
    const to = resolve(dest, entry.name);
    if (entry.isDirectory()) {
      await copyFolder(from, to);
    } else if (entry.isFile()) {
      await copyFile(from, to);
    }
  }
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await ensureDir(DIST);
  await copyFile(resolve(ROOT, 'index.html'), resolve(DIST, 'index.html'));
  await copyFolder(resolve(ROOT, 'public'), DIST);
  console.log('Static assets copied to dist/.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
