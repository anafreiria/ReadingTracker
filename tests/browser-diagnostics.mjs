import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function bounded(promise) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Diagnostic capture timed out.')), 3000); })]);
  } finally { clearTimeout(timer); }
}

// Capture the failing tab before its finally block closes it. Keep the original error.
export async function captureBrowserFailure({call, evaluate, error, exceptions = []}) {
  const directory = process.env.SCREENSHOT_DIR;
  if (!directory) return;
  try {
    await mkdir(directory, {recursive: true});
    const details = {error: error.stack || String(error), exceptions};
    try { details.url = await bounded(evaluate('location.href')); } catch { /* Browser may have exited. */ }
    await writeFile(join(directory, 'failure.json'), JSON.stringify(details, null, 2));
    const shot = await bounded(call('Page.captureScreenshot', {format: 'png'}));
    await writeFile(join(directory, 'failure.png'), Buffer.from(shot.data, 'base64'));
  } catch (diagnosticError) {
    console.error(`Could not capture browser diagnostics: ${diagnosticError.message}`);
  }
}
