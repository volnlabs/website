# Responsive Mobile + Tablet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the VolnLabs Astro site usable on tablet and mobile while leaving the `≥1024px` desktop rendering unchanged.

**Architecture:** Gate the existing global `zoom` hack to desktop only; add three reusable global classes (`.responsive-grid`, `.responsive-split`, `.table-scroll`); tag inline-styled grids per page and add page-local `@media` for tablet-tier and stacking behavior. Two breakpoints: `1024px`, `640px`.

**Tech Stack:** Astro 7 (static output), plain CSS in `<style>` / `is:global` blocks, inline styles. No new dependencies.

## Global Constraints

- **Desktop is source of truth.** No small-screen fix may change `≥1024px` rendering.
- **Breakpoints: `1024px` and `640px` only.** Reconcile stray ones (760/800/900) toward these.
- **No new dependencies. No hamburger menu. No design-token rewrite.**
- **No zoom computation below 1024px** — `document.documentElement.style.zoom = ""`.
- **Every wide table wrapped in `.table-scroll`** — now and in future.
- Shared classes hold only universal behavior; per-grid column counts and tablet-tier collapse stay page-local.

**Verification model:** This is presentational work; the repo has no visual test harness (`npm test` runs unrelated `node --test` unit tests for the contact API). Per-task verification is: `npm run build` succeeds, then `npm run preview` and visually inspect the page at the test widths. Run `npm test` once at the end to confirm nothing unrelated broke.

**Test widths (every page):** 1440, 1280, 1024, 768, 430, 390, 360 px.
Check: no horizontal scroll (except `.table-scroll`), no clipped/overlapping text, grids collapse correctly, hero canvas present + proportioned, nav reachable, keyboard tab order + visible focus intact, no layout jump crossing 1024 beyond the intended zoom on/off.

---

### Task 1: Base layout — zoom gate + shared classes

**Files:**
- Modify: `src/layouts/Base.astro` (zoom script ~lines 50-66; global `<style>` ~lines 44-49)

**Interfaces:**
- Produces: global CSS classes consumed by all later tasks:
  - `.responsive-split` — collapses `grid-template-columns` to `1fr` at `≤1024px`.
  - `.responsive-grid` — collapses `grid-template-columns` to `1fr` at `≤640px`.
  - `.table-scroll` — `overflow-x:auto` horizontal-scroll wrapper.
- Produces: zoom applied only when `innerWidth >= 1024`, else `zoom=""`.

- [ ] **Step 1: Replace the zoom script body**

In `src/layouts/Base.astro`, replace the current `fit()` definition (the `BASE_SCALE` const + `fit` function) with:

```js
function fit() {
  if (window.innerWidth >= 1024) {
    const scale = Math.min(0.68 * Math.max(window.innerWidth / 1200, 1), 1.12);
    document.documentElement.style.zoom = scale;
  } else {
    document.documentElement.style.zoom = "";
  }
}

fit();
window.addEventListener("resize", fit, { passive: true });
```

- [ ] **Step 2: Add shared classes to the `is:global` style block**

Append inside the existing `<style is:global>` block (after the `a { color: inherit; }` line):

```css
.responsive-split { }
.responsive-grid { }
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 1024px) {
  .responsive-split { grid-template-columns: 1fr !important; }
}
@media (max-width: 640px) {
  .responsive-grid { grid-template-columns: 1fr !important; }
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: success, no errors.

- [ ] **Step 4: Visual check**

Run: `npm run preview`. Open `/` (home).
- At 1440 / 1280: identical to before (zoom still applied).
- At 1023 and below: page renders at natural size (no 0.68 shrink). Layout may still be desktop-shaped — that is fixed in later tasks. Confirm only that zoom is off and the page is not micro-scaled.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: gate zoom to desktop, add responsive utility classes"
```

---

### Task 2: Home page (`index.astro`) — hero stack + grids

**Files:**
- Modify: `src/pages/index.astro` (hero section ~lines 7-27; mission grid line 33; programs-card line 59; publications/opensource grid line 114; page `<style>` ~line 143)

**Interfaces:**
- Consumes: `.responsive-grid`, `.responsive-split` from Task 1.

- [ ] **Step 1: Tag the hero elements**

- Hero `<section>` (line 7): add `class="hero"` (keep all inline styles).
- Canvas panel `<div>` (line 8, `width:56%`): add `class="hero-canvas"`.
- Content `<div>` (line 13, `max-width:1200px`): add `class="hero-content"`.
- Text block `<div>` (line 14, `width:46%; min-width:380px`): add `class="hero-text"`.

- [ ] **Step 2: Tag the grids**

- Mission grid (line 33, `grid-template-columns:1.1fr 0.9fr`): add `class="responsive-split"`.
- Programs card `<a>` (line 59, already `class="programs-card"`, `1fr 1fr`): change to `class="programs-card responsive-grid"`.
- Publications/open-source grid `<div>` (line 114, `1fr 1fr`): add `class="responsive-grid"`.

- [ ] **Step 3: Add page-local responsive CSS**

Append inside the page `<style>` block:

```css
@media (max-width: 1024px) {
  .hero { flex-direction: column; min-height: auto; }
  .hero-content { order: 1; padding-top: 110px !important; padding-bottom: 56px !important; }
  .hero-text { width: 100% !important; min-width: 0 !important; }
  .hero-canvas { position: relative !important; width: 100% !important; height: 340px; order: 2; }
}
@media (max-width: 640px) {
  .hero-content { padding-left: 20px !important; padding-right: 20px !important; }
  .hero-canvas { height: 240px; }
  .programs-card { grid-template-columns: 1fr !important; }
}
```

Note: `.programs-card` border between its two cells is a vertical `border-right`; acceptable to leave when stacked, or change to `border-bottom` if it looks wrong at ≤640 — verify visually in Step 5.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Visual check (all test widths)**

Run: `npm run preview`, open `/`.
- ≥1024: unchanged from before.
- ≤1024: hero is text-block on top, canvas panel full-width below it (~340px), no overlap; canvas still renders its topo lines (ResizeObserver redraws).
- ≤640: canvas ~240px; mission, programs-card, and publications/opensource grids all single-column; container padding ~20px; no horizontal scroll.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: responsive home hero and grids"
```

---

### Task 3: Vision page (`vision.astro`) — grids

**Files:**
- Modify: `src/pages/vision.astro` (grids at lines 41, 71, 87; page `<style>`)

**Interfaces:**
- Consumes: `.responsive-grid`, `.responsive-split`.

- [ ] **Step 1: Tag the grids**

- Line 41 (`1.1fr 0.9fr`): add `class="responsive-split"`.
- Line 71 (`repeat(4,1fr)`): add `class="responsive-grid grid-4"`.
- Line 87 (`1fr 1fr`): add `class="responsive-grid"`.

- [ ] **Step 2: Add tablet-tier collapse for the 4-col grid**

The 4-col grid should go 4→2→1. Global `.responsive-grid` only handles →1 at 640. Add to (or create) the page `<style>` block:

```css
@media (max-width: 1024px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
}
```

If `vision.astro` has no `<style>` block, add one before the closing of the file:

```html
<style>
  @media (max-width: 1024px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
  }
</style>
```

- [ ] **Step 3: Add container padding shrink**

For each section wrapper on this page using `padding:...32px`, the inline `32px` stays for desktop. Add a mobile override. Identify the section wrapper class or add `class="vsec"` to each `max-width:1200px` wrapper, then:

```css
@media (max-width: 640px) {
  .vsec { padding-left: 20px !important; padding-right: 20px !important; }
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Visual check**

Run: `npm run preview`, open `/vision` at all test widths.
- ≤1024: split section stacks; 4-col grid becomes 2 columns.
- ≤640: all grids single column; padding ~20px; no horizontal scroll; decorative blob does not create dead space (body `overflow-x:hidden` clips it).

- [ ] **Step 6: Commit**

```bash
git add src/pages/vision.astro
git commit -m "feat: responsive vision page grids"
```

---

### Task 4: People page (`people.astro`) — grids + member table

**Files:**
- Modify: `src/pages/people.astro` (grids lines 52, 90; member-row grid in `<style>` line 114)

**Interfaces:**
- Consumes: `.responsive-grid`.

- [ ] **Step 1: Tag the 3-col grids**

- Line 52 (`repeat(3,1fr)`): add `class="responsive-grid grid-3"`.
- Line 90 (`repeat(3,1fr)`): add `class="responsive-grid grid-3"`.

- [ ] **Step 2: Add tablet-tier collapse + member row stack**

In the page `<style>` block, the member row rule (line ~114) is `grid-template-columns: 1fr 200px 130px;`. Give that rule's selector a class name (note it — e.g. `.member-row`). Add:

```css
@media (max-width: 1024px) {
  .grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
}
@media (max-width: 640px) {
  .member-row { grid-template-columns: 1fr !important; gap: 6px !important; }
}
```

Use the actual existing selector name for the `1fr 200px 130px` rule in place of `.member-row` if it differs; if it has no class, add `class="member-row"` to that element in the markup.

- [ ] **Step 3: Container padding shrink**

Add `class="psec"` to each `max-width:1200px` wrapper on the page, then:

```css
@media (max-width: 640px) {
  .psec { padding-left: 20px !important; padding-right: 20px !important; }
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Visual check**

Run: `npm run preview`, open `/people` at all test widths.
- ≤1024: 3-col grids become 2-col.
- ≤640: grids single column; member rows stack name/role/links vertically; no clipped text; no horizontal scroll.

- [ ] **Step 6: Commit**

```bash
git add src/pages/people.astro
git commit -m "feat: responsive people page grids and member rows"
```

---

### Task 5: Publications page (`publications.astro`) — paper rows

**Files:**
- Modify: `src/pages/publications.astro` (paper row grid line 48; page `<style>` if present, else add one)

**Interfaces:**
- Consumes: none beyond Task 1 (no shared grid class needed — row collapse is page-local).

- [ ] **Step 1: Tag the paper row**

Line 48 row (`grid-template-columns:70px 1fr 160px 130px`): add `class="pub-row"` to that `<div>` (keep inline styles).

- [ ] **Step 2: Add stacking CSS**

Add a page `<style>` block (or append to existing):

```html
<style>
  @media (max-width: 640px) {
    .pub-row { grid-template-columns: 1fr !important; gap: 6px !important; align-items: start !important; }
  }
</style>
```

- [ ] **Step 3: Container padding shrink**

The header wrapper (line 14) and list wrappers use `padding:...32px`. Add `class="pubsec"` to each `max-width:1200px` wrapper, then in the `<style>`:

```css
@media (max-width: 640px) {
  .pubsec { padding-left: 20px !important; padding-right: 20px !important; }
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Visual check**

Run: `npm run preview`, open `/publications` at all test widths.
- ≤640: each paper row stacks (year, title, venue, links on separate lines); no horizontal scroll; filter chips (line 36, already `flex-wrap`) wrap fine.

- [ ] **Step 6: Commit**

```bash
git add src/pages/publications.astro
git commit -m "feat: responsive publications paper rows"
```

---

### Task 6: Benchmarks page (`benchmarks.astro`) — table scroll + breakpoint reconcile

**Files:**
- Modify: `src/pages/benchmarks.astro` (wrap `.compact` and `.host-table`; `<style>` `@media (max-width:900px)` ~line 613)

**Interfaces:**
- Consumes: `.table-scroll` from Task 1.

- [ ] **Step 1: Wrap wide tables**

Find the elements using `.compact` (`min-width:560px`) and `.host-table` (`min-width:480px`). Wrap each in a scroll container:

```html
<div class="table-scroll">
  <!-- existing .compact / .host-table element -->
</div>
```

- [ ] **Step 2: Reconcile the existing breakpoint**

The page has `@media (max-width:900px)`. Change `900` to `1024` so the tablet tier matches the global breakpoint:

```css
@media (max-width: 1024px) {
  /* existing rules unchanged */
}
```

If any rule inside should only apply at phone size, move it to a `@media (max-width: 640px)` block instead. Verify visually rather than guessing.

- [ ] **Step 3: Container padding shrink**

If section wrappers use `padding:...32px` and aren't already handled by the existing media block, add a `@media (max-width: 640px)` rule reducing horizontal padding to `20px` for the page's section-wrapper selector.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Visual check**

Run: `npm run preview`, open `/benchmarks` at all test widths.
- ≤1024: multi-col grids collapse per existing rules (now at 1024).
- ≤640: wide comparison tables scroll horizontally **inside** their `.table-scroll` box — the page itself has no horizontal scroll; rest of page single column.

- [ ] **Step 6: Commit**

```bash
git add src/pages/benchmarks.astro
git commit -m "feat: wrap wide benchmark tables, align breakpoint to 1024"
```

---

### Task 7: Reconcile existing responsive pages (`research`, `opensource`, `contact`)

**Files:**
- Modify (only if needed): `src/pages/research.astro`, `src/pages/opensource.astro`, `src/pages/contact.astro`

**Interfaces:** none new.

These pages already have `@media` (research: 800/480; opensource: 760; contact: 760). Do not rewrite them. Only adjust breakpoints toward 1024/640 **where a visible break occurs** at the test widths.

- [ ] **Step 1: Visual check first (no edits yet)**

Run: `npm run preview`. Open `/research`, `/opensource`, `/contact` at all test widths. Record any: horizontal scroll, clipped/overlapping text, grids that fail to collapse, padding too tight/loose at 1024 or 640.

- [ ] **Step 2: Fix only what broke**

For each issue found, make the minimal change — typically shifting an existing `760`/`800` breakpoint to `1024`, or adding a `@media (max-width: 640px)` padding/stack rule. Reuse `.table-scroll` if any table overflows. No gratuitous restructuring.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Re-check the three pages** at all test widths; confirm issues resolved and desktop unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/pages/research.astro src/pages/opensource.astro src/pages/contact.astro
git commit -m "fix: align research/opensource/contact breakpoints to 1024/640"
```

(If no changes were needed, skip the commit and note it.)

---

### Task 8: Full-site verification + 404

**Files:**
- Modify (only if needed): `src/pages/404.astro`

**Interfaces:** none.

- [ ] **Step 1: Check 404**

`/404` uses `max-width:1200px; padding:96px 32px`. At ≤640, add a padding reduction if it looks cramped:

```html
<style>
  @media (max-width: 640px) {
    .nf-wrap { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
```

(add `class="nf-wrap"` to the wrapper div). Skip if it already reads fine.

- [ ] **Step 2: Full sweep**

Run: `npm run build` then `npm run preview`. Visit every page (`/`, `/vision`, `/research`, `/publications`, `/opensource`, `/people`, `/benchmarks`, `/contact`, `/404`) at **1440, 1280, 1024, 768, 430, 390, 360**.

For each, confirm the full checklist: no unintended horizontal scroll, no clipped/overlapping text, grids collapse correctly, hero canvas present + proportioned, nav pill reachable (scrolls horizontally), keyboard tab order + visible focus intact, no layout jump crossing 1024 beyond zoom on/off.

- [ ] **Step 3: Confirm unrelated tests still pass**

Run: `npm test`
Expected: existing contact-API unit tests pass (unchanged by this work).

- [ ] **Step 4: Commit any 404 change**

```bash
git add src/pages/404.astro
git commit -m "fix: responsive padding on 404 page"
```

(Skip if 404 needed no change.)

---

## Self-Review

**Spec coverage:**
- Zoom gate → Task 1. ✓
- Shared classes (`.responsive-grid`, `.responsive-split`, `.table-scroll`) → Task 1. ✓
- No `.container-pad` / no `.col-N` → honored (padding is page-local). ✓
- Hero shrink-not-hide → Task 2. ✓
- `index`/`vision`/`people`/`publications` tagging → Tasks 2–5. ✓
- Benchmarks table-scroll + 900→1024 → Task 6. ✓
- `research`/`opensource`/`contact` reconcile → Task 7. ✓
- Decorative blobs clip via `overflow-x:hidden` → noted Tasks 3-5. ✓
- Verification widths + keyboard + CLS → Task 8 (and per task). ✓
- Desktop-as-source-of-truth → Global Constraints + every "≥1024 unchanged" check. ✓
- Table-scroll convention → Global Constraints. ✓

**Placeholder scan:** Page-local selector names (`.vsec`, `.psec`, `.member-row`, etc.) are introduced where the existing element has no class — the plan instructs adding the class to that element. No "TBD"/"handle edge cases".

**Type consistency:** Class names referenced match between Task 1 (definitions) and Tasks 2-8 (consumers): `.responsive-split`, `.responsive-grid`, `.table-scroll`.
