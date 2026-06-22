# Axiom Benchmarks Website Integration — Design Spec

Date: 2026-06-23

## Objective

Publish the supplied Axiom kernel benchmark results as a clear, reproducible
technical resource while keeping the existing VolnLabs marketing pages concise.

The website will gain a dedicated `/benchmarks` page. Home, Research, Open
Source, and the footer will point readers to it with a small number of verified
hardware proof points.

## Source and Scope

The supplied benchmark document is the content source. The canonical repository
for code and reproduction instructions is:

`https://github.com/volnlabs/axiomos`

The integration covers:

- Axiom results from Raspberry Pi 5 hardware
- Linux Raspberry Pi 5 baseline results
- QEMU development results and limitations
- Host verifier microbenchmarks
- On-device verifier-cost and execution-cost calibration
- WCET and utilization-admission validation
- Measurement definitions and reproduction commands
- Known gaps and next actions

It does not add new benchmark claims, recalculate source measurements, or imply
that metrics with different measurement paths are directly interchangeable.

## Information Architecture

### Dedicated `/benchmarks` page

The page is the canonical website location for detailed benchmark data.

Sections:

1. Hero and environment summary
2. Raspberry Pi 5 proof points
3. Axiom and Linux side-by-side comparison
4. Measurement-scope caveat
5. Verifier scaling
6. WCET calibration and utilization admission
7. QEMU development measurements
8. Methodology
9. Reproduction commands
10. Limitations, gaps, and next actions

The page should prioritize hardware results and comparison context. Detailed
tables remain available but are grouped so the page can be scanned without
reading every row.

### Home

Replace the existing AxiomOS metrics strip with supplied hardware measurements:

- `99 ms` — boot to init
- `211 ns` — hardware entry to BPF execution
- `<1 µs` — BPF program load average

Add a link to `/benchmarks`.

The existing `4 µs` worst-case jitter claim is removed because it is not
supported by the supplied benchmark document.

### Research

Add a compact measured-results section after the AxiomOS program detail. It will
show the three hardware proof points and briefly connect them to the verified
runtime and admission-control research. A CTA links to `/benchmarks`.

### Open Source

Add a reproducibility section with:

- the Raspberry Pi 5 release build command
- the host verifier benchmark command
- a link to the canonical GitHub repository
- a link to the full benchmark methodology

The existing repository URL and clone command will be made clickable and use
`github.com/volnlabs/axiomos`.

### Navigation

Add `Benchmarks` under the footer's Lab column. Do not add it to the fixed
navigation pill, which is already dense.

## Page Design

The benchmark page follows the site's existing design system:

- Bricolage Grotesque for display type
- Space Mono for body text, metrics, and commands
- warm neutral backgrounds
- near-black technical sections
- blue for links and comparison accents
- yellow-green for favorable measured Axiom results

### Hero

The hero identifies the page as measured systems performance rather than a
general product claim. It includes:

- “Axiom Kernel Benchmarks”
- Raspberry Pi 5 hardware as the authoritative environment
- last measurement dates for the relevant datasets
- a repository link

### Proof-point cards

Four primary Raspberry Pi 5 results are shown:

- boot to init: `99 ms`
- interrupt path latency: `211 ns avg`
- BPF load: `<1 µs avg`
- kernel heap at init: `12,290 KB`

The image size (`10 MB`) is shown as supporting context, not merged into heap
usage.

### Comparison table

The primary comparison includes:

| Metric | Axiom | Linux | Qualification |
| --- | --- | --- | --- |
| Boot to init | 99 ms | 573.124 ms | Both reported to init-related milestones |
| Kernel image | 10 MB | ~15.2 MB | Linux figure is compressed `vmlinuz` |
| Runtime footprint | 12,290 KB heap; ~22 MB image + heap | ~30–60 MB kernel footprint | Definitions differ |
| BPF load | <1 µs | 24.80 µs | Axiom minimal load path vs Linux verifier path |
| Interrupt latency | 211 ns | 2 µs average | Different tools and path endpoints |

Relative figures such as `~5.8×`, `~25×`, and `~10×` may be displayed only next
to the associated qualification. The page explicitly states that Linux
`cyclictest` wakeup latency and Axiom hardware-entry-to-BPF latency are useful
context but are not identical measurements.

### Verifier and admission sections

The page includes:

- host verifier scaling from 10 to 1,000 instructions
- Pi 5 verifier cycles and `states_explored`
- execution-cost class calibration
- `CYCLE_UNIT_NS = 6`
- one-program budget of approximately `166,666` units
- cumulative utilization budget of `5e8 ns/s`
- on-hardware admission result: 14 copy-heavy attachments admitted and the 15th
  rejected
- embedded `bpf_trace_printk` RT-fragment rejection policy

Long tables should remain horizontally scrollable on narrow screens rather than
compressing columns until they become unreadable.

### QEMU section

QEMU is clearly labeled as a development and regression environment. It shows:

- 45 ms boot to init
- 2,231 KB kernel heap
- 3,787 µs average BPF load
- 495 µs emulated timer interval

The page does not repeat the source statement that QEMU boot is slower than
hardware because the supplied figures show a lower QEMU boot measurement.
Instead, it states only that QEMU timing is distorted and is not an
authoritative hardware comparison.

### Methodology and reproducibility

Method definitions distinguish:

- boot milestone
- heap usage
- BPF load path
- hardware-entry-to-BPF latency
- timer interval collection
- verifier-only cost

Commands are presented in code blocks with copy-friendly formatting. The
repository URL uses `https://github.com/volnlabs/axiomos`.

## Responsive Behavior

- Metric grids collapse from four columns to two, then one.
- Comparison and verifier tables use horizontal overflow containers.
- Split layouts collapse into a single column.
- Existing global page zoom behavior remains unchanged.
- Links and CTAs remain keyboard accessible and visibly interactive.

## Data Representation

Benchmark rows and proof points will be declared as arrays in the Astro page
frontmatter and rendered with `.map()`. This reduces repeated markup and makes
future result updates localized.

No client-side framework or charting dependency is introduced. The current site
uses static Astro and inline styles, and the benchmark implementation will
follow that constraint.

## Accuracy Rules

- Preserve units and indicate averages, minima, and maxima where relevant.
- Keep measurement dates visible.
- Separate heap usage, image size, and combined footprint.
- Do not call the Linux and Axiom interrupt measurements identical.
- Label QEMU values as non-authoritative.
- Describe `<1 µs` as resolution-limited where the detailed result appears.
- Preserve the stated gaps: no PREVAIL head-to-head and one nominal 1 kHz hook
  frequency.

## Verification

Implementation verification will include:

- `npm run build`
- generated-page checks for `/benchmarks`
- searches confirming old unsupported home metric text is removed
- searches confirming the canonical repository URL is used
- responsive source review for table overflow and grid breakpoints
- review of benchmark values against this specification

