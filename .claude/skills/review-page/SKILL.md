---
name: review-page
description: Generate a clean, scrollable, PO-friendly HTML review page for a mockup screen — from its screen narrative + PRD. Use when the operator says "review page", "make this PO-friendly", "html review", "/review-page", or asks to turn a screen/PRD into something easy to review without reading markdown. Also use when preparing a mockup → LayerPulse handover bundle.
---

# review-page — PO-friendly HTML deliverable generator

## Why this exists

The product owner finds dense markdown high cognitive load. Per Anthropic's "unreasonable effectiveness of HTML" guidance, a self-contained HTML artifact is far better for review than markdown: it's visual, scannable, shareable by link, opens in any browser, and keeps the human in the loop. This skill standardizes that output so every screen + PRD gets a consistent, branded review page — and so the mockup → LayerPulse handover always includes one.

**Validated principles (from the blog) baked into the template:**
- Self-contained single `.html` file — no build step, no dependencies, works in any browser.
- Visual hierarchy + colour-coding + grouped sections — single-pass readability.
- Side-by-side comparison where it helps (e.g. automated vs manual buckets, the 4 audiences).
- Plain language. Short sentences. Domain terms OK (the PO is a Fabric expert) but no markdown-table density.
- Keep the human in the loop: end with a small "decisions for you" block, not a wall of FRs.
- Interactivity only when it earns its place. Static + scannable beats clever.

## When to use

- Operator asks for a "review page" / "PO-friendly" / "HTML review" of a screen or PRD.
- A screen narrative (`docs/screens/<x>.md`) + PRD (`docs/prds/<x>.md`) exist and need a human-review surface.
- Preparing a handover bundle for LayerPulse (see `docs/handover/README.md`).

## How to generate one

1. **Read the sources.** `docs/screens/<screen>.md` (the design) + `docs/prds/<screen>.md` (the spec). If a section catalogue exists (e.g. `docs/documents-section-catalogue.md`), read it too.
2. **Translate to plain language.** Strip jargon-density. Each section answers: *what is it · why it matters · what (if anything) we need from you.*
3. **Use the template below** (`template.html` in this skill dir). Keep the brand tokens. Fill the slots:
   - **Hero** — title + one-line "what this is" + read-time + "for: PO review".
   - **The one-sentence version** — a gold-bordered callout. The single idea.
   - **Two buckets** (if the screen has an automated/manual or any A/B split) — side-by-side cards.
   - **Cards row** — variants/audiences/options as cards (one-liners, not paragraphs).
   - **The full menu** — grouped list with colour-coded tags (`auto` / `your team` / `soon`). No dense tables.
   - **See it live** — buttons deep-linking the live mockup route.
   - **Decisions for you** — the open questions as numbered plain choices.
   - **Footer** — live links + note that detailed `.md` lives in the repo for the build team.
4. **Write to** `public/review/<screen>.html` (Vite serves `public/` at the deploy root; Vercel serves static files before the SPA rewrite, so `/review/<screen>.html` resolves directly — no `vercel.json` change needed).
5. **Add a card** for the new page to `public/review/index.html` (the handover hub).
6. **Deep-link the live routes** to production `https://layerpulze-mockup.vercel.app/<route>` (or the branch preview while iterating).
7. **Build-verify** (`npm run build`) — confirm `dist/review/<screen>.html` exists.

## Hard rules

- **Self-contained.** Inline all CSS. Google Fonts via `<link>` is fine. No JS frameworks; tiny vanilla JS only if a toggle genuinely helps.
- **Brand tokens** (locked — match the mockup): navy `#0D3159`, sky `#2491eb`, gold `#FFBF3C`, orange `#F56E23`. Body font DM Sans; numbers/code JetBrains Mono. Tag tones: auto=green, manual=violet, soon=slate.
- **Plain language.** No "FR-LIB-3" / requirement IDs / acceptance-checklist tables. That detail stays in the `.md` for the build team.
- **Always end with "decisions for you."** The PO's job is to decide; surface the decisions, don't bury them.
- **Tie to source.** The page is generated FROM `screen.md` + `prd.md` — if those change, regenerate. Never let the review page drift into its own source of truth.

## Template

The reference template is `template.html` in this skill directory. Copy it, keep the `<style>` block verbatim, replace the content between the marked slots. The shipped example to model after is `public/review/documents.html`.

## Output convention

```
public/review/
├── index.html          ← handover hub (one card per screen)
├── documents.html      ← per-screen review
├── glossary.html
└── <screen>.html
```

One link to hand to LayerPulse: `https://layerpulze-mockup.vercel.app/review/`.
