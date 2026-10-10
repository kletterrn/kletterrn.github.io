# David Khaliqi portfolio — design guidelines

These rules record the approved direction and the user's corrections on 10 October 2026. Read before changing the site.

## Identity and colors
Use near-black #101010, charcoal #181818, warm white #f1f1e9, grey #999a97, electric blue #3153ff and the shared icy-blue tokens in styles.css.
Use slate-blue project artwork: #354a68, #1e2b40, #101823. Ignis retains its established cobalt artwork.
Do not introduce violet, purple or an unrelated palette for Botium or future cybersecurity work.
Use the shared CSS variables for interface colors, borders, focus and surfaces.

## Typography
Inter Tight: primary typography. Instrument Serif: selected expressive moments. DM Mono: labels and metadata.
Project titles follow existing size, weight, letter spacing and line height. Do not invent a different heading scale per card.

## Project-card structure — mandatory
Reuse .project-panel, .project-panel-head, .project-state, .project-title, .panel-caption, .project-arrow and .project-hover.
Top-left: category/index. Top-right: status pill.
Left: short introduction ABOVE the large two-line title.
Right: project visual; it must not overlap the title or metadata.
Bottom-left: compact caption. Bottom-right: circular arrow.
Below the card: description left; technologies and direct resource/code link right.
Use the established desktop aspect ratio 1.9 and responsive height rules.
Do not replace this with a separate grid-style promotional card or an inline Explore CTA.
Reuse the existing pointer-following View project circle; hide the native pointer only when active.
On mobile use the shared vertical flow, 44px touch targets and static artwork; no desktop positioning.
Honor prefers-reduced-motion.

## Project pages
Keep shared header, footer, spacing and type. Showcase precedes contributions.
Use neutral/blue tables, notes, buttons and findings, not per-project interface palettes.
Distinguish course scenarios, source documents, findings and proposed work; do not claim tests or implementation that did not happen.
Make Botium source material readable alongside the audit. Its full source text is at /work/botium-audit/scope-report/ and the download is /assets/audit/botium-scope-risk-report.txt.
Do not publish private embedded document links or metadata.

## Existing user constraints
Preserve the approved glass-prism hero; no apprenticeship banner above it.
No stray navigation 02, MOVE TO CHANGE THE LIGHT, pause-motion control or CV editor.
The drone name is Orion, not R12 or Orion-E.
Preserve both German and English CV pages and project code links.

## Review before publication
Compare all project cards at desktop and mobile widths. Check title/visual alignment, status, caption, arrow, pointer behavior, overflow, focus and contrast.
Keep unrelated project content and the hero unchanged. Report visual QA limits honestly.
