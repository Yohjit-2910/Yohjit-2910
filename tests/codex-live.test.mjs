import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('card gets a fresh image URL when usage changes on the same day', () => {
  const dir = mkdtempSync(join(tmpdir(), 'codex-card-test-'));
  try {
    mkdirSync(join(dir, 'scripts')); mkdirSync(join(dir, 'assets')); mkdirSync(join(dir, 'data'));
    copyFileSync('scripts/build-codex.mjs', join(dir, 'scripts/build-codex.mjs'));
    const data = JSON.parse(readFileSync('data/codex.json', 'utf8'));
    writeFileSync(join(dir, 'README.md'), '<img src="assets/codex-dark.svg?v=old">');
    writeFileSync(join(dir, 'data/codex.json'), JSON.stringify(data));
    execFileSync(process.execPath, ['scripts/build-codex.mjs'], { cwd: dir });
    const before = readFileSync(join(dir, 'README.md'), 'utf8');
    data.stats.lifetimeTokens = '9.1B';
    writeFileSync(join(dir, 'data/codex.json'), JSON.stringify(data));
    execFileSync(process.execPath, ['scripts/build-codex.mjs'], { cwd: dir });
    const after = readFileSync(join(dir, 'README.md'), 'utf8');
    assert.notEqual(after, before, 'image URL should change when usage changes');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
