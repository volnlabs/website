# VolnLabs Website — Design Spec
Date: 2026-06-22

## Overview
Static marketing/research site for VolnLabs. 7 pages. Deployed on Vercel. Source design from claude.ai/design project `1ba73945-9b03-4082-a076-b49d67feaf29`.

## Tech Stack
- **Framework**: Astro (static output)
- **Adapter**: `@astrojs/vercel/static`
- **Fonts**: Bricolage Grotesque + Space Mono (Google Fonts)
- **Styling**: Inline styles matching DC design files (no Tailwind)
- **JS**: Vanilla only (nav scroll behavior, hero canvas)

## Architecture

```
src/
  layouts/
    Base.astro          # html shell, fonts, global CSS, meta
  components/
    Nav.astro           # fixed pill nav, scroll-aware logo fade
    Footer.astro        # dark footer with 4-column grid
  pages/
    index.astro         # Home
    vision.astro        # Vision
    research.astro      # Research / AxiomOS
    publications.astro  # Publications
    opensource.astro    # Open Source
    people.astro        # People (Utkarsh Maurya)
    contact.astro       # Contact
public/
  assets/               # logo images (fetched from design project)
```

## Pages & Content Source

| Page | DC Source | Notes |
|---|---|---|
| Home | `voln-home.dc.html` | Hero canvas, 6 sections |
| Vision | `voln-vision.dc.html` | |
| Research | `voln-research.dc.html` | AxiomOS detail |
| Publications | `voln-publications.dc.html` | |
| Open Source | `voln-opensource.dc.html` | |
| People | `voln-people.dc.html` | Utkarsh Maurya: projects.utkarshmaurya@gmail.com, linkedin.com/in/utkarsh_maurya_connect, @gilfoyle_v2 |
| Contact | `voln-contact.dc.html` | Display only: research@kernex.sbs |

## Shared Components

### Nav.astro
- Fixed, `z-index: 95`, transparent background, `pointer-events: none`
- Logo: `volnlabs.` — white when dark hero + not scrolled, fades out on scroll
- Pill: white background, rounded, always visible
- Links: Vision / Research / Publications / Open Source / People / Contact (CTA blue)
- Scroll behavior: vanilla JS in `<script>` tag, `window.scrollY > 28` threshold
- Accepts `theme` prop: `'light' | 'dark'` (home page = dark)

### Footer.astro
- Dark background `#0a0a0b`, 4-column grid
- Columns: Brand + CTA | Explore | Lab | Connect
- Copyright: `© 2026 VolnLabs · voln.systems`

### Base.astro
- Google Fonts preconnect + stylesheet
- Global reset: `margin:0; padding:0; box-sizing:border-box`
- `::selection` color: `#054FF0` / `#F9F8F3`
- Accepts `title` and `theme` props, passes `theme` to Nav

## Design Tokens
| Token | Value |
|---|---|
| Background warm | `#ECE9DF` |
| Background warm-dark | `#E5E1D5` |
| Background dark | `#100F0D` |
| Background black | `#0a0a0b` |
| Card background | `#F4F1E8` |
| Text primary | `#0a0a0b` |
| Text light | `#F9F8F3` |
| Accent blue | `#054FF0` |
| Accent yellow-green | `#DCFC73` |
| Font mono | Space Mono |
| Font display | Bricolage Grotesque |

## Contact Page
Display `research@kernex.sbs` as mailto link. No form submission. Show collaboration invitation text from DC design.

## People Page
Single person card: Utkarsh Maurya
- Email: projects.utkarshmaurya@gmail.com
- LinkedIn: linkedin.com/in/utkarsh_maurya_connect
- X: @gilfoyle_v2
