# VolnLabs Astro Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 7-page static Astro website for VolnLabs, faithful to the claude.ai/design DC files.

**Architecture:** Astro static site with one Base layout (fonts + global CSS), Nav/Footer as shared components, 7 page files. All content translated from DC design files — inline styles preserved, DC template vars replaced with static values.

**Tech Stack:** Astro 5, @astrojs/vercel static adapter, Google Fonts (Bricolage Grotesque + Space Mono), vanilla JS for nav scroll + hero canvas.

## Global Constraints
- No TypeScript, no Tailwind, no component frameworks
- Inline styles from DC files — do not refactor to CSS classes except for hover states and scroll-driven JS
- All links use `.html`-less paths (Astro handles this by default with static build)
- Fonts: `Bricolage Grotesque` (display) + `Space Mono` (mono/body)
- Color palette: `#ECE9DF` warm bg, `#100F0D` dark, `#054FF0` blue, `#DCFC73` yellow-green, `#F9F8F3` light, `#0a0a0b` near-black

---

### Task 1: Scaffold Astro + configure Vercel adapter

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/components/Nav.astro`
- Create: `src/components/Footer.astro`
- Modify: `astro.config.mjs`
- Delete: `index.html` (replaced by src/pages/index.astro)

- [ ] Scaffold Astro minimal in project dir
```bash
cd /home/utkarsh/Work/volnlabs/website && npm create astro@latest . -- --template minimal --no-install --no-git --yes 2>&1 || true
npm install
```

- [ ] Install Vercel adapter
```bash
cd /home/utkarsh/Work/volnlabs/website && npx astro add vercel --yes
```

- [ ] Set astro.config.mjs output to static
```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';
export default defineConfig({ output: 'static', adapter: vercel() });
```

- [ ] Create Base.astro with fonts + global CSS + Nav + Footer slots
- [ ] Create Nav.astro (fixed pill, scroll-aware logo)
- [ ] Create Footer.astro (4-column dark footer)
- [ ] `npm run build` — verify no errors

---

### Task 2: Home page (index.astro)

**Files:**
- Create: `src/pages/index.astro`

- [ ] Translate voln-home.dc.html → index.astro
- [ ] Hero with topo canvas (vanilla JS from DC logic)
- [ ] 6 sections: Mission, Programs, Verify, Work, CTA
- [ ] Nav theme="dark"

---

### Task 3: Vision page

**Files:**
- Create: `src/pages/vision.astro`

Principles data (from DC script):
```
{ n:'01', title:'Scientific Rigor', body:'Every claim should be measurable, reproducible, and experimentally validated.' }
{ n:'02', title:'Systems Thinking', body:'Progress comes from integrating disciplines, not optimizing isolated components.' }
{ n:'03', title:'Safety First', body:'Adaptive systems must stay verifiable and understandable even as they evolve.' }
{ n:'04', title:'Open Research', body:'Whenever possible, research is published, documented, and shared with the community.' }
```
Near term: Public release of AxiomOS · Initial Neuro Systems experiments · Eidos research prototype · DistriProc prototype · First research publications
Long term: Adaptive robotics platform · Human intent interfaces · Verified runtime evolution · Distributed intelligent robot fleets · Computational neuroscience contributions

---

### Task 4: Research page

**Files:**
- Create: `src/pages/research.astro`

Stack pipeline (from DC script): Authenticate → Analyze → Admit → Contain
Program: AxiomOS — areas: Verified Runtime, Static Safety, Timing Admission, Behavior Auth, Reference Monitor, Hardware E-Stop

---

### Task 5: Publications page

**Files:**
- Create: `src/pages/publications.astro`

Publications (from DC script):
```
{ year:'2026', title:'AxiomOS: A Verified Runtime for Safe Robot Behavior Evolution', authors:'VolnLabs Systems Group', program:'AxiomOS', status:'In prep' }
{ year:'2026', title:'Admission Control for Worst-Case Timing in Hot-Swappable Behaviors', authors:'VolnLabs Systems Group', program:'AxiomOS', status:'In prep' }
```

---

### Task 6: Open Source page

**Files:**
- Create: `src/pages/opensource.astro`

Repo: AxiomOS at github.com/volnlabs/axiomos, status "Releasing"

---

### Task 7: People page

**Files:**
- Create: `src/pages/people.astro`

Founder card: Utkarsh Maurya — projects.utkarshmaurya@gmail.com — linkedin.com/in/utkarsh_maurya_connect — @gilfoyle_v2 on X
Culture values + open roles + collaborators from DC script.

---

### Task 8: Contact page

**Files:**
- Create: `src/pages/contact.astro`

Form submit = mailto:research@volnlabs.com (no server POST). Keep full form UI from DC design.

---

### Task 9: Final build + cleanup

- [ ] Delete root `index.html`
- [ ] `npm run build` — verify clean
- [ ] Check all 7 pages render without errors
