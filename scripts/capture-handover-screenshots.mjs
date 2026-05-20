import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:5174';
const OUT = 'docs/handover/screenshots';

const log = (...a) => console.log('[shot]', ...a);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

async function goto(path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
}
async function soft(fn) { try { await fn(); } catch { /* keep going */ } }

// ---- Documents: library + the generated-document preview modal ----
try {
  await goto('/documents');
  await soft(() => page.getByRole('heading', { name: 'Documents' }).first().waitFor());
  await page.screenshot({ path: `${OUT}/documents/01-library.png` });
  log('documents/01-library');

  // Open a document → preview modal. Click the row heading text.
  await page.getByText('Sales Analytics').first().click();
  // modal is up once the page-counter / audience switcher appears
  await page.getByText(/Page\s*1\s*of/i).first().waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/documents/02-preview.png` });
  log('documents/02-preview');

  // Switch to the Auditor variant to show the audience switcher in action
  await soft(async () => {
    await page.getByRole('button', { name: 'Auditor' }).first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/documents/03-preview-auditor.png` });
    log('documents/03-preview-auditor');
  });
} catch (e) {
  log('documents FAILED:', e.message);
}

// ---- Glossary: A–Z default + full page ----
try {
  await goto('/glossary');
  await soft(() => page.getByRole('heading', { name: 'Business glossary' }).first().waitFor());
  await page.screenshot({ path: `${OUT}/glossary/01-az.png` });
  await page.screenshot({ path: `${OUT}/glossary/02-az-full.png`, fullPage: true });
  log('glossary done');
} catch (e) {
  log('glossary FAILED:', e.message);
}

// ---- Ownership: workspace defaults + full page ----
try {
  await goto('/ownership');
  await soft(() => page.getByRole('heading', { name: 'Ownership' }).first().waitFor());
  await page.screenshot({ path: `${OUT}/ownership/01-defaults.png` });
  await page.screenshot({ path: `${OUT}/ownership/02-defaults-full.png`, fullPage: true });
  log('ownership done');
} catch (e) {
  log('ownership FAILED:', e.message);
}

await browser.close();
log('all done');
