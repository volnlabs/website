# Axiom Benchmarks Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a detailed Axiom kernel benchmark page and concise, qualified benchmark proof points across the VolnLabs website.

**Architecture:** Keep the site static and dependency-free beyond Astro. Add one data-driven `benchmarks.astro` page, update existing pages with compact links and metrics, and add Node built-in tests that enforce the published values, caveats, and canonical repository URL.

**Tech Stack:** Astro 7, static HTML, inline CSS, Node.js built-in test runner, npm

---

## File Map

- Create `src/pages/benchmarks.astro`: canonical benchmark results, methodology, and reproducibility page.
- Create `tests/benchmark-content.test.mjs`: source-level content contract for benchmark values, qualifications, links, and navigation.
- Modify `package.json`: expose the Node test runner as `npm test`.
- Modify `src/pages/index.astro`: replace stale Axiom metrics with supplied hardware results and link to benchmarks.
- Modify `src/pages/research.astro`: add a compact measured-results section.
- Modify `src/pages/opensource.astro`: add repository and reproduction links/commands.
- Modify `src/components/Footer.astro`: add the Benchmarks route under Lab.

### Task 1: Add the benchmark content contract

**Files:**

- Create: `tests/benchmark-content.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing content tests**

Create `tests/benchmark-content.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('benchmark page publishes the authoritative Pi 5 results', async () => {
  const page = await read('src/pages/benchmarks.astro');
  for (const value of ['99 ms', '211 ns', '&lt;1 &micro;s', '12,290 KB']) {
    assert.match(page, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
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
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
node --test tests/benchmark-content.test.mjs
```

Expected: FAIL because `src/pages/benchmarks.astro` does not exist and the
existing home page still contains `4&micro;s`.

- [ ] **Step 3: Add the npm test command**

Update `package.json` scripts:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "test": "node --test tests/*.test.mjs",
  "preview": "astro preview",
  "astro": "astro"
}
```

- [ ] **Step 4: Commit the red test**

```bash
git add package.json tests/benchmark-content.test.mjs
git commit -m "test: define benchmark content contract"
```

### Task 2: Build the canonical benchmark page

**Files:**

- Create: `src/pages/benchmarks.astro`
- Test: `tests/benchmark-content.test.mjs`

- [ ] **Step 1: Define page data in Astro frontmatter**

Create `src/pages/benchmarks.astro`, import `Base`, and define arrays for:

```js
const proofPoints = [
  { value: '99 ms', label: 'Boot to init', note: 'Kernel timer · Pi 5' },
  { value: '211 ns', label: 'Interrupt path average', note: 'Hardware entry to BPF' },
  { value: '<1 µs', label: 'BPF load average', note: 'Resolution-limited' },
  { value: '12,290 KB', label: 'Kernel heap at init', note: 'Image excluded' },
];

const comparison = [
  { metric: 'Boot to init', axiom: '99 ms', linux: '573.124 ms', note: 'Init-related milestones; ~5.8× lower Axiom time.' },
  { metric: 'Kernel image', axiom: '10 MB', linux: '~15.2 MB', note: 'Linux value is compressed vmlinuz.' },
  { metric: 'Runtime footprint', axiom: '12,290 KB heap; ~22 MB image + heap', linux: '~30–60 MB kernel footprint', note: 'Definitions differ; shown as context.' },
  { metric: 'BPF load', axiom: '<1 µs avg', linux: '24.80 µs avg', note: 'Different load and verification paths; ~25× by reported averages.' },
  { metric: 'Interrupt latency', axiom: '211 ns avg', linux: '2 µs avg', note: 'Different tools and path endpoints; ~10× by reported averages.' },
];

const verifierHardware = [
  ['10', '10', '1398', '139.8', '25.9'],
  ['50', '50', '3974', '79.5', '73.6'],
  ['100', '100', '7676', '76.8', '142.1'],
  ['500', '500', '41533', '83.1', '769.1'],
  ['1000', '1000', '93551', '93.6', '1732.4'],
];

const calibration = [
  ['straight', 'COST_DEFAULT', '1', '0.31', '5.8', 'baseline'],
  ['memory', 'COST_MEMORY', '2', '0.41', '7.6', 'conservative'],
  ['div', 'COST_ALU_EXPENSIVE', '2', '0.34', '6.3', 'retuned 4→2'],
  ['ktime', 'COST_HELPER_READ', '4', '1.18', '21.9', 'near-exact'],
  ['map', 'COST_HELPER_MAP', '16', '4.16', '77.0', 'conservative'],
  ['copy / gpio_get', 'COST_HELPER_COPY', '10', '2.54', '47.1', 'conservative'],
  ['ringbuf / output', 'COST_HELPER_RINGBUF', '12', '3.24', '60.1', 'conservative'],
  ['trace / printk', 'COST_HELPER_TRACE', '20', '—', '—', 'forbidden on embedded RT fragment'],
];

const qemu = [
  ['Boot to init', '45 ms'],
  ['Kernel heap', '2,231 KB'],
  ['BPF load', '3,787 µs avg of 10'],
  ['Timer interval', '495 µs'],
];
```

- [ ] **Step 2: Implement the hero and proof points**

Use `<Base title="Axiom Kernel Benchmarks" bgColor="#F9F8F3">`.

The hero must state:

```text
Axiom Kernel Benchmarks
Measured systems performance, with the environment and path made explicit.
Raspberry Pi 5 hardware measurements are authoritative. QEMU numbers are for
development iteration and regression detection.
```

Include visible metadata for:

- Raspberry Pi 5 Model B Rev 1.0, 8 GB
- Cortex-A76 at 2.4 GHz, frequency scaling disabled
- kernel commit `bedc93c`
- hardware result date `2026-03-14`
- verifier/admission capture date `2026-06-11`
- host verifier date `2026-06-13`
- canonical repository link

Render `proofPoints` as four cards.

- [ ] **Step 3: Implement the qualified comparison**

Render `comparison` in a horizontally scrollable table. Immediately above or
below it include this explicit caveat:

```text
Comparison scope matters. Linux cyclictest reports scheduling/wakeup latency;
Axiom measures hardware entry to the first BPF instruction. The figures provide
useful system context, but they are not identical measurements.
```

Also show timer stability:

- interval: 9,999–10,000 µs across 100 samples
- hardware-to-BPF latency: min 203 ns, max 351 ns, avg 211 ns

- [ ] **Step 4: Implement verifier and admission sections**

Render `verifierHardware` and `calibration` as scrollable tables. Include:

```text
states_explored == n for all 13 loaded programs.
```

Add admission cards/text with:

- `CYCLE_UNIT_NS = 6`
- per-program budget `≈166,666` units at a 1 kHz period
- cumulative budget `5e8 ns/s`, or half a core
- `attached=14 rc=-1 PASS`
- the 15th attach rejected because it would exceed the utilization budget
- `bpf_trace_printk` rejected on the embedded real-time fragment

Add the host Criterion table:

```js
const hostVerifier = [
  ['minimal', '738–743 ns'],
  ['arithmetic', '1.279–1.284 µs'],
  ['10 instructions', '2.272–2.288 µs'],
  ['50 instructions', '11.164–11.203 µs'],
  ['100 instructions', '23.148–23.390 µs'],
  ['500 instructions', '143.20–144.63 µs'],
  ['1000 instructions', '311.71–314.96 µs'],
  ['linear control flow', '1.530–1.534 µs'],
  ['single branch', '1.798–1.803 µs'],
  ['multi branch', '2.542–2.549 µs'],
];
```

- [ ] **Step 5: Implement QEMU, methodology, and reproducibility**

Render `qemu` and label it:

```text
Development environment, not a hardware baseline
```

State that virtualized interrupts, memory access, and synthetic timers introduce
timing distortions.

Methodology cards must define boot time, heap footprint, BPF load, interrupt
latency, timer interval, and verifier-only cost.

Add code blocks for:

```bash
git clone https://github.com/volnlabs/axiomos
cd axiomos
./scripts/build-rpi5.sh release --features embedded-rpi5
cargo bench -p kernel_bpf --bench verifier --features embedded-profile
./scripts/build-rpi5.sh release --features embedded-rpi5,verifier-cost
scripts/verifier-cost.py verifier-cost.log -o verifier-cost.csv \
  --plot verifier-cost.png --cntfrq 54000000
```

Close with:

```text
Known gaps: PREVAIL head-to-head has not yet run. Hook fire frequency currently
uses one nominal 1 kHz control-loop rate; per-hook and caller-declared
frequencies remain future work.
```

- [ ] **Step 6: Add page-local responsive styles**

Add a `<style>` block with:

```css
.benchmark-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.benchmark-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
.benchmark-table { width:100%; min-width:760px; border-collapse:collapse; }
.benchmark-table th, .benchmark-table td { text-align:left; vertical-align:top; }
@media (max-width: 900px) {
  .benchmark-grid { grid-template-columns:repeat(2,1fr); }
  .benchmark-split { grid-template-columns:1fr !important; }
}
@media (max-width: 560px) {
  .benchmark-grid { grid-template-columns:1fr; }
}
```

- [ ] **Step 7: Run the focused tests**

Run:

```bash
npm test
```

Expected: benchmark-page tests pass; the site-surfacing test still fails until
the existing pages are updated.

- [ ] **Step 8: Commit**

```bash
git add src/pages/benchmarks.astro
git commit -m "feat: add Axiom benchmark results page"
```

### Task 3: Update the home proof points

**Files:**

- Modify: `src/pages/index.astro`
- Test: `tests/benchmark-content.test.mjs`

- [ ] **Step 1: Replace the current three-column metrics strip**

Replace:

```text
1.00 kHz / Control loop
4µs / Worst-case jitter
Admitted / Every behavior, before hardware
```

with:

```text
99 ms / Boot to init · Raspberry Pi 5
211 ns / Hardware entry to BPF · average
<1 µs / BPF program load · average
```

Add a `/benchmarks` link labeled `Review benchmark methodology →`.

- [ ] **Step 2: Run the focused test**

Run:

```bash
node --test --test-name-pattern="site surfaces benchmarks" tests/benchmark-content.test.mjs
```

Expected: still FAIL because Research, Open Source, and Footer have not yet been
updated; the home assertions pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: surface measured Axiom results on home"
```

### Task 4: Add measured results to Research

**Files:**

- Modify: `src/pages/research.astro`
- Test: `tests/benchmark-content.test.mjs`

- [ ] **Step 1: Add a measured-results section**

Insert after Program Detail and before the publications CTA. Use a dark section
with:

```text
Measured on Raspberry Pi 5
Runtime verification is useful only if its cost fits the control budget.
```

Show:

- `99 ms` boot to init
- `211 ns` average hardware-to-BPF latency
- `<1 µs` average BPF load
- `14` copy-heavy attachments admitted before cumulative utilization rejects
  the 15th

Add a link:

```html
<a href="/benchmarks" class="btn-benchmarks">Read benchmarks &amp; methodology →</a>
```

Add the associated hover class to the page `<style>` block.

- [ ] **Step 2: Run the focused test**

Run:

```bash
node --test --test-name-pattern="site surfaces benchmarks" tests/benchmark-content.test.mjs
```

Expected: still FAIL only on Open Source and Footer assertions.

- [ ] **Step 3: Commit**

```bash
git add src/pages/research.astro
git commit -m "feat: connect Axiom research to hardware results"
```

### Task 5: Add reproducibility links and footer navigation

**Files:**

- Modify: `src/pages/opensource.astro`
- Modify: `src/components/Footer.astro`
- Test: `tests/benchmark-content.test.mjs`

- [ ] **Step 1: Make the repository references canonical and clickable**

Use:

```html
<a href="https://github.com/volnlabs/axiomos"
   target="_blank"
   rel="noopener">github.com/volnlabs/axiomos</a>
```

The clone command must be:

```bash
git clone https://github.com/volnlabs/axiomos
```

- [ ] **Step 2: Add a reproducibility block**

In the existing dark reproducibility section, include:

```text
Build Raspberry Pi 5 release
./scripts/build-rpi5.sh release --features embedded-rpi5

Run host verifier benchmarks
cargo bench -p kernel_bpf --bench verifier --features embedded-profile
```

Add a `/benchmarks` link labeled `Read benchmark methodology →`.

- [ ] **Step 3: Add footer navigation**

Under the Footer Lab column add:

```html
<a href="/benchmarks">Benchmarks</a>
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test
```

Expected: 4 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/pages/opensource.astro src/components/Footer.astro
git commit -m "feat: publish benchmark reproduction paths"
```

### Task 6: Build and audit the complete site

**Files:**

- Verify: all changed files

- [ ] **Step 1: Build the Astro site**

Run:

```bash
npm run build
```

Expected: exit 0 and `/benchmarks/index.html` generated.

- [ ] **Step 2: Verify generated benchmark content**

Run:

```bash
test -f dist/benchmarks/index.html
rg -n "99 ms|211 ns|PREVAIL|github.com/volnlabs/axiomos" dist/benchmarks/index.html
```

Expected: the file exists and all four strings are present.

- [ ] **Step 3: Verify stale and incorrect content is absent**

Run:

```bash
if rg -n "4&micro;s|github.com/axiom/axiom-ebpf" src dist; then
  exit 1
fi
```

Expected: exit 0 with no matches.

- [ ] **Step 4: Check formatting and final diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intended source/test/plan changes are
listed.

- [ ] **Step 5: Final test and build gate**

Run:

```bash
npm test && npm run build
```

Expected: 4 tests pass and the Astro build exits 0.

- [ ] **Step 6: Commit any final audit corrections**

```bash
git add src tests package.json
git commit -m "fix: finalize benchmark content audit"
```

Only create this commit if the audit required corrections.

