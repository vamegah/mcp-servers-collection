import { test } from 'node:test';
import assert from 'node:assert';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test('check ffmpeg installation', async () => {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    assert(stdout.includes('ffmpeg version'), 'FFmpeg should be installed');
  } catch (error) {
    console.warn('FFmpeg not found - some features will not work');
  }
});

test('check sharp installation', async () => {
  try {
    const sharp = await import('sharp');
    assert(typeof sharp.default === 'function', 'Sharp should be available');
  } catch (error) {
    assert.fail('Sharp is required for image processing');
  }
});