// Test infrastructure only. The application itself remains plain HTML/CSS/JS.
import { createServer } from 'node:http';
import { createWriteStream, existsSync } from 'node:fs';
import { access, appendFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const frontend = join(root, 'src', 'main', 'resources', 'static');
const smokeOnly = process.argv.includes('--smoke-only');
if (process.argv.slice(2).some(argument => argument !== '--smoke-only')) throw Error('Usage: node scripts/check-frontend.mjs [--smoke-only]');
if (Number(process.versions.node.split('.')[0]) < 24) throw Error('Frontend checks require Node 24 or newer.');
const reportBase = process.env.FRONTEND_REPORT_DIR ? resolve(process.env.FRONTEND_REPORT_DIR) : tmpdir();
await mkdir(reportBase, {recursive: true});
const reports = await mkdtemp(join(reportBase, 'reading-tracker-check-'));
const results = [];
let activeChild, browser, browserError, browserLog, serverLog, server, profile, cancelled = false, failure;
const cancel = () => { cancelled = true; activeChild?.kill('SIGTERM'); browser?.kill('SIGTERM'); };
process.once('SIGINT', cancel);
process.once('SIGTERM', cancel);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const finishLog = stream => stream ? new Promise(resolve => stream.end(resolve)) : Promise.resolve();

async function runStep(name, script, {args = [], env = {}, timeout = 240_000} = {}) {
  if (cancelled) throw Error('Frontend checks cancelled.');
  console.log(`\n[${name}]`);
  const started = Date.now();
  const log = createWriteStream(join(reports, `${name}.log`));
  const child = spawn(process.execPath, [...args, script], {cwd: root, env: {...process.env, ...env}, stdio: ['ignore', 'pipe', 'pipe']});
  activeChild = child;
  for (const [stream, destination] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    stream.on('data', chunk => { log.write(chunk); destination.write(chunk); });
  }
  let timedOut = false, launchError, killTimer;
  child.once('error', error => { launchError = error; });
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
    killTimer = setTimeout(() => child.kill('SIGKILL'), 4000);
  }, timeout);
  const outcome = await new Promise(resolve => child.once('close', (code, signal) => resolve({code, signal})));
  clearTimeout(timer);
  clearTimeout(killTimer);
  activeChild = undefined;
  const error = launchError?.message || (timedOut ? `Exceeded ${timeout / 1000}s timeout.` : null);
  if (error) log.write(`${error}\n`);
  await finishLog(log);
  results.push({name, ...outcome, error, durationMs: Date.now() - started});
  if (outcome.code !== 0 || error || cancelled) throw Error(`${name} failed${error ? `: ${error}` : ` (${outcome.signal || outcome.code})`}. See ${name}.log.`);
}

async function javaScriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (entry.isDirectory()) files.push(...await javaScriptFiles(join(directory, entry.name)));
    else if (entry.name.endsWith('.js')) files.push(join(directory, entry.name));
  }
  return files.sort();
}

async function startServer() {
  serverLog = createWriteStream(join(reports, 'server.log'));
  const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png'};
  server = createServer(async (request, response) => {
    let status = 500;
    try {
      if (!['GET', 'HEAD'].includes(request.method)) { status = 405; response.writeHead(status).end(); return; }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(frontend, `.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`);
      if (!file.startsWith(`${frontend}${sep}`) || pathname.includes('\0')) { status = 403; response.writeHead(status).end(); return; }
      const bytes = await readFile(file);
      status = 200;
      response.writeHead(status, {'Content-Type': `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store'});
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      status = ['ENOENT', 'EISDIR'].includes(error.code) ? 404 : error instanceof URIError ? 400 : 500;
      response.writeHead(status).end();
    } finally { serverLog.write(`${request.method} ${request.url} ${status}\n`); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return `http://127.0.0.1:${server.address().port}`;
}

async function startBrowser() {
  const candidates = process.env.CHROME_BIN
    ? [process.env.CHROME_BIN]
    : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];

  const executable = candidates.find(candidate =>
    process.platform === 'win32'
      ? candidate.endsWith('.exe') && existsSync(candidate)
      : spawnSync(candidate, ['--version'], {timeout: 5000, encoding: 'utf8'}).status === 0
  );

  if (!executable) throw Error('Chrome was not found. Install Chrome or set CHROME_BIN to its executable path.');
  profile = await mkdtemp(join(tmpdir(), 'reading-tracker-chrome-'));
  browserLog = createWriteStream(join(reports, 'chrome.log'));
  browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking',
    '--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND, MAP fonts.gstatic.com ~NOTFOUND',
    '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, ...(process.env.CI === 'true' || process.getuid?.() === 0 ? ['--no-sandbox'] : []), 'about:blank'],
  {stdio: ['ignore', 'pipe', 'pipe']});
  browser.once('error', error => { browserError = error; });
  browser.stdout.pipe(browserLog, {end: false});
  browser.stderr.pipe(browserLog, {end: false});
  for (let attempt = 0; attempt < 150; attempt++) {
    if (cancelled) throw Error('Frontend checks cancelled.');
    if (browserError || browser.exitCode !== null) throw Error(`Chrome failed to start: ${browserError?.message || browser.exitCode}. See chrome.log.`);
    try {
      const port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
      if (/^\d+$/.test(port)) {
        const response = await fetch(`http://127.0.0.1:${port}/json/version`, {signal: AbortSignal.timeout(2000)});
        if (response.ok) {
          const version = await response.json();
          await writeFile(join(reports, 'environment.json'), JSON.stringify({node: process.version, chrome: version.Browser, executable}, null, 2));
          return port;
        }
      }
    } catch { /* The process may still be creating its debugging endpoint. */ }
    await delay(100);
  }
  throw Error('Chrome did not become ready within 15 seconds. See chrome.log.');
}

async function stopBrowser() {
  if (!browser || browser.exitCode !== null || browser.signalCode !== null) return;
  await new Promise(resolve => {
    const timer = setTimeout(() => { browser.kill('SIGKILL'); resolve(); }, 4000);
    browser.once('close', () => { clearTimeout(timer); resolve(); });
    browser.kill('SIGTERM');
  });
}

try {
  console.log(`Reports: ${reports}`);
  for (const file of await javaScriptFiles(frontend)) await runStep(`syntax-${file.slice(frontend.length + 1).replaceAll(/[\\/]/g, '-')}`, file, {args: ['--check'], timeout: 30_000});
  const tests = (await readdir(join(root, 'tests'))).filter(name => name.endsWith('.test.mjs')).sort();
  const domainTests = tests.filter(name => !name.endsWith('.browser.test.mjs'));
  const browserTests = tests.filter(name => name.endsWith('.browser.test.mjs') && name !== 'smoke.browser.test.mjs');
  if (!domainTests.length || !browserTests.length) throw Error('Expected domain and browser tests under tests/.');
  if (!smokeOnly) for (const name of domainTests) await runStep(name, join(root, 'tests', name));
  const appUrl = await startServer();
  const debugPort = await startBrowser();
  await access(join(root, 'tests', 'smoke.browser.test.mjs'));
  console.log(`HTTP server: ${appUrl}; Chrome ready on port ${debugPort}.`);
  for (const name of ['smoke.browser.test.mjs', ...(smokeOnly ? [] : browserTests)]) {
    const screenshots = join(reports, name.replace('.browser.test.mjs', ''));
    await runStep(name, join(root, 'tests', name), {env: {APP_URL: appUrl, CHROME_DEBUG_PORT: debugPort, SCREENSHOT_DIR: screenshots}});
  }
} catch (error) {
  failure = error;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await stopBrowser();
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
  await finishLog(serverLog);
  await finishLog(browserLog);
  if (profile) await rm(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 100});
  process.removeListener('SIGINT', cancel);
  process.removeListener('SIGTERM', cancel);
  const summary = {passed: !failure, mode: smokeOnly ? 'smoke-only' : 'full', error: failure?.message || null, results};
  await writeFile(join(reports, 'summary.json'), JSON.stringify(summary, null, 2));
  const markdown = `## Frontend checks: ${summary.passed ? 'passed' : 'failed'}\n\n` +
    results.map(result => `- ${result.code === 0 && !result.error ? 'PASS' : 'FAIL'} ${result.name} (${(result.durationMs / 1000).toFixed(1)}s)`).join('\n') +
    (failure ? `\n\n${failure.message}\n` : '\n');
  await writeFile(join(reports, 'summary.md'), markdown);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log(`\nFrontend checks ${summary.passed ? 'passed' : 'failed'}. Reports: ${reports}`);
}
