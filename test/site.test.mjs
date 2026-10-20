import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const routes = ['', 'actryn', 'axiomos', 'research', 'about', 'contact', 'pitch'];
const navLinks = ['/actryn', '/axiomos', '/research', '/about', '/contact'];
const footerLinks = ['/actryn', '/axiomos', '/research', '/about', '/pitch'];

const outputFile = (route) => route ? `dist/${route}/index.html` : 'dist/index.html';

test('builds every stable public route', async () => {
  await Promise.all([...routes.map((route) => access(outputFile(route))), access('dist/404.html')]);
});

test('renders shared navigation and footer links on every public route', async () => {
  for (const route of routes) {
    const html = await readFile(outputFile(route), 'utf8');
    const primaryNav = html.match(/<nav[^>]+aria-label="Primary"[^>]*>[\s\S]*?<\/nav>/)?.[0];
    const footer = html.match(/<footer[^>]*>[\s\S]*?<\/footer>/)?.[0];
    assert.ok(primaryNav, `${route || 'home'} missing primary navigation`);
    assert.ok(footer, `${route || 'home'} missing footer`);
    for (const link of navLinks) assert.ok(primaryNav.includes(`href="${link}"`), `${route || 'home'} primary nav missing ${link}`);
    for (const link of footerLinks) assert.ok(footer.includes(`href="${link}"`), `${route || 'home'} footer missing ${link}`);
  }
});

test('keeps the old research people fragment useful', async () => {
  const research = await readFile('dist/research/index.html', 'utf8');
  assert.match(research, /id="people"/);
  assert.ok(research.includes('href="/about"'));
});

test('publishes stable routes and the pitch page in the sitemap', async () => {
  const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
  for (const route of routes) {
    const url = route ? `https://www.volnlabs.com/${route}` : 'https://www.volnlabs.com';
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap missing ${url}`);
  }
});

test('routes old durable URLs to their new owners', async () => {
  const config = JSON.parse(await readFile('.vercel/output/config.json', 'utf8'));
  const redirects = new Map(config.routes.filter((route) => route.status === 301).map((route) => [route.src, route.headers.Location]));
  assert.equal(redirects.get('^/vision$'), '/axiomos');
  assert.equal(redirects.get('^/people$'), '/about');
  assert.equal(redirects.get('^/publications$'), '/research#papers');
  assert.equal(redirects.get('^/opensource$'), '/about#open-source');
  assert.equal(redirects.has('^/contact$'), false);
});

test('exposes direct email, booking, repository, and PDF destinations', async () => {
  const [contact, actryn, axiomos, pitch] = await Promise.all([
    readFile('dist/contact/index.html', 'utf8'),
    readFile('dist/actryn/index.html', 'utf8'),
    readFile('dist/axiomos/index.html', 'utf8'),
    readFile('dist/pitch/index.html', 'utf8'),
  ]);
  assert.ok(contact.includes('href="mailto:utkarsh@volnlabs.com"'));
  assert.ok(contact.includes('href="https://cal.com/utkarsh-maurya/axiomos"'));
  assert.ok(actryn.includes('href="https://github.com/volnlabs/actryn"'));
  assert.ok(axiomos.includes('href="https://github.com/volnlabs/axiomos"'));
  assert.ok(pitch.includes('href="/pitch-deck.pdf"'));
  await access('dist/pitch-deck.pdf');
});
