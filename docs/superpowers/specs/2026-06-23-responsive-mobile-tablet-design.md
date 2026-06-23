# Responsive Mobile + Tablet Support — Design

**Date:** 2026-06-23
**Status:** Approved (pending spec review)

## Goal

Make the VolnLabs marketing site (Astro, 8 pages) usable on tablet and mobile.
Preserve the current desktop design almost entirely. Small diff, low risk.

**Priority:** desktop layout is the source of truth. Mobile adapts to desktop, never the
other way around — no fix for a small screen may change the `≥1024px` rendering.

## Context

- Astro static site, `output: 'static'`, Vercel adapter.
- Pages: `index`, `vision`, `research`, `publications`, `opensource`, `people`,
  `benchmarks`, `contact`, `404`.
- Heavy use of **inline styles** with fixed-width grids (`grid-template-columns:1fr 1fr`,
  `width:46%;min-width:380px`), fluid `clamp()` typography, fixed `32px` paddings.
- `Base.astro` runs a global `zoom` script: scales the whole document by
  `min(0.68 * max(innerWidth/1200, 1), 1.12)`. On a phone this forces ~0.68 zoom over a
  desktop-width layout → tiny text + horizontal scroll. This is the main blocker.

### Current responsive coverage

- **Has `@media` + CSS classes:** `benchmarks`, `contact`, `opensource`, `research`, `Nav`.
- **No responsive at all (inline grids):** `index`, `people`, `publications`, `vision`.
- **Overflow risks:** `benchmarks` `.compact{min-width:560px}`, `.host-table{min-width:480px}`;
  fixed-column "table rows" in `people` / `publications`.

## Decisions

1. **Direction:** full responsive for mobile + tablet (not desktop-only gate).
2. **Zoom hack:** keep on desktop (`≥1024px`) only; disabled below — no zoom math on mobile.
3. **Breakpoints:** two — `1024px` (desktop/tablet boundary) and `640px` (tablet/mobile
   boundary). 640 catches larger phones; common breakpoint.
4. **No hamburger menu** — Nav pill already horizontal-scrolls on mobile; acceptable for a
   portfolio site.

## Approach

Targeted responsive + a **small shared utility layer**. Rejected alternatives:
- Full design-token / utility-class rewrite — giant diff across inline-styled pages (YAGNI).
- Pure no-breakpoint fluid (`auto-fit minmax`, flex-wrap only) — can't cleanly handle the hero
  canvas split or asymmetric grids.

### 1. `Base.astro`

**Zoom gate** — replace the current always-on script with:

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

Performance: the resize handler only mutates `document.documentElement.style.zoom`; no layout
recalculation is introduced beyond the browser reflow that any zoom change triggers. Acceptable
for a `resize`-frequency listener.

**Shared global `<style>`** (added to the existing `is:global` block) — only behavior that is
genuinely common goes here. Layout assumptions (how many columns a given grid has, and how a grid
behaves at the tablet tier) stay **page-specific**. Do not introduce `.col-2/3/4` or a
`.container-pad`.

```css
/* multi-column grid -> single column at mobile. Tablet-tier behavior (e.g. 4->2)
   is decided per page, since it depends on that grid's desktop column count. */
.responsive-grid { }            /* page sets desktop columns inline/in its own <style> */

/* two-pane asymmetric split (e.g. 1.1fr 0.9fr) -> stacked at tablet down */
.responsive-split { }

/* horizontal-scroll wrapper for wide tables */
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

@media (max-width: 1024px) {
  .responsive-split { grid-template-columns: 1fr !important; }
}
@media (max-width: 640px) {
  .responsive-grid { grid-template-columns: 1fr !important; }
}
```

Why no universal tablet collapse: forcing every `.responsive-grid` to `repeat(2,1fr)` at 1024
would needlessly rewrite grids that are already 2-col on desktop. A 4-col grid that wants `4→2→1`
adds its own `@media (max-width:1024px){ grid-template-columns:repeat(2,1fr) }` in-page. The
shared layer only guarantees the universal truth: everything collapses to one column on a phone.

**Container padding** (`32→24→20px`): handled in each page's own `@media` blocks, not a global
utility — most sections are inline-styled, so a `.container-pad` class would have to be tagged
onto nearly every section. Less indirection to set it where the breakpoint already lives.

Naming rule: a class goes in the shared layer only if genuinely reused. `.responsive-grid` /
`.responsive-split` describe intent, not column count — a 3-col grid tagged `.responsive-grid`
won't read as a lie later.

### 2. Per-page tagging + fixes

- **`index`**
  - Hero: desktop `46% / 54%` text-vs-canvas split unchanged. Tablet (`≤1024`): canvas panel
    goes full-width **below** the text (stack), text block full width. Mobile (`≤640`): canvas
    height clamped to `220–260px`. **Never hide the canvas** — it is landing-page identity.
  - Tag the 4 inline grids (mission `1.1fr 0.9fr`, programs-card `1fr 1fr`, pub/os `1fr 1fr`)
    with `.responsive-grid` / `.responsive-split` as appropriate.
- **`vision`** — tag `1.1fr 0.9fr` (split), `repeat(4,1fr)` (grid), `1fr 1fr` (grid).
- **`people`** — tag the two `repeat(3,1fr)` grids; the `1fr 200px 130px` table row → stack `≤640`.
- **`publications`** — `70px 1fr 160px 130px` row → stack `≤640`.
- **`benchmarks`** — wrap `.compact` and `.host-table` in `<div class="table-scroll">`. Verify
  its existing `@media (max-width:900px)` still composes with the new 1024/640 rules (adjust the
  900 breakpoint to 1024 if it conflicts). **Convention:** every wide table added to the site
  from now on must be wrapped in `.table-scroll`, so the horizontal-overflow bug can't be
  reintroduced one page at a time.
- **`research` / `opensource` / `contact`** — already have `@media`; verify they still look right
  at the new test sizes; align stray breakpoints (760/800px) toward 1024/640 only if they cause
  visible breaks. No gratuitous rewrites.
- Decorative absolute "glow"/blob elements (`people`, `publications`, `vision`): body already has
  `overflow-x:hidden` so they clip; shrink offsets `≤640` only where they leave dead whitespace.

### 3. Verification

`npm run build` must pass. Then visually check every page at:

**1440, 1280, 1024, 768, 430, 390, 360 px.**

Check for:
- horizontal scroll (except intended `.table-scroll`)
- overlapping / clipped text
- collapsed grids reading correctly
- hero canvas present and proportioned
- nav reachable
- keyboard navigation still works (tab order, focus visible)
- no CLS during resize — crossing the 1024 boundary must not jump layout beyond the intended
  zoom-on/zoom-off change

## Out of scope

- Hamburger / mobile nav drawer.
- Design-token or utility-framework rewrite.
- Any change to desktop (`≥1024px`) appearance beyond what the zoom gate already preserves.

## Effort estimate

Base layout ~15% · page tagging ~45% · mobile fixes ~30% · testing ~10%.
