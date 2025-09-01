import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testVaultPath = path.join(__dirname, 'test-vault');

test('setup test vault', async () => {
  await fs.mkdir(testVaultPath, { recursive: true });
  
  // Create test notes
  await fs.writeFile(
    path.join(testVaultPath, 'test-note.md'),
    '---\ntags: [test, example]\n---\n\n# Test Note\n\nThis is a test note with [[linked-note]] reference.'
  );
  
  await fs.writeFile(
    path.join(testVaultPath, 'linked-note.md'),
    '# Linked Note\n\nThis note is linked from the test note.'
  );
});

test('cleanup test vault', async () => {
  await fs.rm(testVaultPath, { recursive: true, force: true });
});