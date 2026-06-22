import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('benchmark page publishes the authoritative Pi 5 results', async () => {
  const page = await read('src/pages/benchmarks.astro');

  for (const value of ['99 ms', '211 ns', '<1 µs', '12,290 KB']) {
    assert.ok(page.includes(value), `missing ${value}`);
  }

  assert.match(page, /Raspberry Pi 5/);
  assert.match(page, /Hardware measurements are authoritative/);
});

test('benchmark page qualifies comparisons and QEMU data', async () => {
  const page = await read('src/pages/benchmarks.astro');

  assert.match(page, /not identical measurements/i);
  assert.match(page, /cyclictest/);
  assert.match(page, /hardware entry to BPF execution/i);
  assert.match(page, /development and regression/i);
  assert.match(page, /timing distortions/i);
});

test('benchmark page includes verifier, admission, and reproducibility data', async () => {
  const page = await read('src/pages/benchmarks.astro');

  for (const value of [
    'states_explored',
    '166,666',
    '5e8 ns/s',
    'attached=14',
    '15th attach',
    'PREVAIL',
    'github.com/volnlabs/axiomos',
    'cargo bench -p kernel_bpf --bench verifier --features embedded-profile',
  ]) {
    assert.ok(page.includes(value), `missing ${value}`);
  }
});

test('site surfaces benchmarks without retaining the unsupported jitter claim', async () => {
  const [home, research, openSource, footer] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/pages/research.astro'),
    read('src/pages/opensource.astro'),
    read('src/components/Footer.astro'),
  ]);

  assert.doesNotMatch(home, /4&micro;s|4 µs/);
  assert.match(home, /99 ms/);
  assert.match(home, /211 ns/);
  assert.match(home, /href="\/benchmarks"/);
  assert.match(research, /href="\/benchmarks"/);
  assert.match(openSource, /github\.com\/volnlabs\/axiomos/);
  assert.match(openSource, /href="\/benchmarks"/);
  assert.match(footer, /href="\/benchmarks"/);
});

test('shared navigation contains a mobile overflow guard', async () => {
  const nav = await read('src/components/Nav.astro');

  assert.match(nav, /@media \(max-width: 680px\)/);
  assert.match(nav, /#nav-logo\s*\{\s*display:\s*none;/);
  assert.match(nav, /max-width:\s*calc\(100vw - 20px\)/);
  assert.match(nav, /overflow-x:\s*auto/);
});
