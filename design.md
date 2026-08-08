# Design System — "Tarsi" Style

_Reference: fintech/business dashboard UI (green, calm, data-forward)_

## 1. Overall Character

A quiet, trustworthy fintech aesthetic. Lots of white space, soft off-white page background, crisp white cards, one confident forest-green brand color used sparingly for emphasis (active states, progress, positive status), and muted grays doing most of the talking. Nothing shouts — status and urgency are communicated through small pill badges, not saturated color blocks. Feels like a calm, well-organized ledger rather than a flashy SaaS product.

---

## 2. Color Palette

| Token                        | Hex (approx) | Usage                                                      |
| ---------------------------- | ------------ | ---------------------------------------------------------- |
| `--color-bg-page`            | `#F5F4F1`    | App background behind cards (warm light gray)              |
| `--color-bg-surface`         | `#FFFFFF`    | Card / panel background                                    |
| `--color-bg-subtle`          | `#F2F1EE`    | Nested boxes inside cards (stat tiles, sublists)           |
| `--color-brand-green`        | `#1F4B32`    | Primary brand — filled progress segments, active nav       |
| `--color-brand-green-soft`   | `#E7F0E5`    | Icon chip backgrounds, active nav pill background          |
| `--color-text-primary`       | `#1B1B18`    | Headings, key figures (near-black, not pure black)         |
| `--color-text-secondary`     | `#6E6E68`    | Labels, descriptions, helper text                          |
| `--color-text-tertiary`      | `#A5A49E`    | Placeholder / very low-emphasis (axis labels "0%", "3 mo") |
| `--color-border-hairline`    | `#E7E6E2`    | Card borders, dividers                                     |
| `--color-track-inactive`     | `#E3E2DE`    | Unfilled progress segments / gauge ticks                   |
| `--color-status-positive`    | `#2F6B3F`    | "Comfortable" dot + text                                   |
| `--color-status-negative`    | `#B3492E`    | "Overdue" badge, "Below costs" label                       |
| `--color-status-warning`     | `#C97A2B`    | "Watch" badge (amber/terracotta)                           |
| `--color-status-warning-bg`  | `#FBEEDF`    | Warning badge background                                   |
| `--color-status-negative-bg` | `#FBEAE5`    | Negative badge background                                  |

**Principles:**

- Green is the _only_ brand hue — everything else is neutral gray/beige, so green reads as meaningful (money, growth, "good").
- Status colors (red/amber/green) are reserved strictly for badges and small dots — never large fills.
- Backgrounds step in three flat tones: page (warmest/darkest neutral) → card (white) → nested tile (slightly warm gray) — creating depth without shadows doing the heavy lifting.

---

## 3. Typography

| Role                                      | Family                                    | Weight  | Size (approx) | Notes                                   |
| ----------------------------------------- | ----------------------------------------- | ------- | ------------- | --------------------------------------- |
| Sidebar logo                              | Geometric sans (e.g. Inter, General Sans) | 600     | 16px          | Tight tracking                          |
| Nav item                                  | Sans                                      | 500     | 14px          | Muted gray, dark on active              |
| Card title                                | Sans                                      | 600     | 16–18px       | Dark, near-black                        |
| Card subtitle / description               | Sans                                      | 400     | 13px          | Secondary gray                          |
| Big metric number (e.g. ₱2,528.40, 6+ mo) | Sans                                      | 700     | 28–32px       | Tabular/lining figures, dark            |
| Stat label (Planning target, Used, etc.)  | Sans                                      | 400–500 | 12–13px       | Secondary gray, often above the number  |
| Badge / pill text                         | Sans                                      | 600     | 11–12px       | Uppercase not used — sentence case kept |
| Axis / scale labels (0%, 20%, 40%+)       | Sans                                      | 500     | 11px          | Tertiary gray                           |

**Recommended stack:** `Inter`, `General Sans`, or `Söhne` for UI text — a clean grotesque with friendly rounded terminals; no serif anywhere in this system. Numbers should use tabular figures so stat columns align.

---

## 4. Layout & Spacing

- **Grid**: Left sidebar (fixed, ~260px) + fluid main content area with generous outer margin (~32–40px).
- **Card padding**: ~24px internal padding, consistent across all card types.
- **Card-to-card gutter**: ~20–24px both horizontally and vertically.
- **Border radius**: Large and consistent — cards ~16–20px, pills/badges fully rounded (9999px), nested stat tiles ~12px, icon chips ~10px.
- **Shadows**: Very subtle, near-invisible (`0 1px 2px rgba(0,0,0,0.04)`), relying mostly on the page/card color contrast and hairline borders rather than heavy elevation.
- **Section rhythm**: Section header (bold title + gray one-line description) sits above a row/grid of cards, ~16px gap between header and cards.

```
[Sidebar]  [Content ─────────────────────────────]
           [Card: Tax Reserve — full width         ]
           [Section: Financial Pulse]
           [Card][Card][Card][Card]  ← 4-up gauge row
           [Card: Monthly Spending Plan — full width]
```

---

## 5. Components

### Sidebar Navigation

- White background, no border, generous vertical rhythm between grouped sections.
- Active item: soft green pill background (`--color-brand-green-soft`), dark green/black text, icon matches text color.
- Inactive items: gray icon + gray text, no background.
- Section groups (Money, Sales, Spending…) have a chevron to expand/collapse; expanded child items indent and lose their own icon-chip treatment, staying flat/text-only.

### Stat Card (e.g. "Tax Reserve")

- Header row: icon chip (soft green circle/rounded square, ~36px) + title (bold) + subtitle (gray, regular) beside it.
- Body: 2–3 nested light-gray tiles side by side, each with a small label on top and a large bold value below.
- Progress element: segmented dash/bar (not a smooth fill) — a row of small rounded rectangles, filled ones in brand green, unfilled in light gray track color. Percentage label at end.
- Optional footer row: a slightly differently-shaded strip (soft green tint) containing a secondary detail (date/reference) and a status badge aligned right.

### Gauge Card (Financial Pulse tiles)

- Compact card: title + status pill in the top row (dot + label, e.g. "● Comfortable").
- One-line gray description under the title explaining what the metric means.
- Semi-circular dashed gauge: made of discrete rounded tick marks (not a continuous arc), green ticks for "filled" portion, light gray for remainder. Big bold value centered underneath the arc (e.g. "6+ mo").
- Axis labels at bottom-left / bottom-right (min/max), tertiary gray, small.
- Variant: some gauge cards use a vertical bar-comb (many thin vertical bars) instead of an arc, with the value as a large number in the header instead of centered — used for simpler 0-to-max metrics.

### Badge / Status Pill

- Fully rounded corners, small horizontal padding, tinted background matching the status color at low opacity, colored text/dot matching the semantic color (green=good, amber=watch, red/terracotta=overdue or negative).
- Always paired with a small solid dot when used as a legend-style indicator ("● Below costs").

### Progress / Budget Bar

- Same segmented-block style as the tax reserve bar: a row of evenly spaced rounded rectangles rather than one continuous bar. This is a signature, repeated motif across the whole system (used for both funding progress and monthly budget usage).
- Paired stat trio above the bar: Planned / Used / Remaining, each with label-on-top, bold-number-below, right-aligned for the last figure.
- Below the bar: a percentage-used label, and optionally a nested list of category rows (name + "% used" + a status badge like "Watch" when a category is trending over budget).

---

## 6. Iconography

- Simple, single-weight line icons (not filled), ~18–20px, stroke width ~1.5–1.75px.
- Icons sit either bare (nav) or inside a soft rounded-square/circle chip with a light brand-tint background (card headers).
- Consistent icon-to-text color relationship: icon color always matches or is a muted version of the adjacent text/heading color.

---

## 7. Motion / Interaction Notes (implied, not visible but consistent with style)

- Keep transitions subtle: 150–200ms ease for hover states, pill/badge fades, progress bar fills.
- Segmented progress bars should animate by filling segment-by-segment rather than a smooth sweep, reinforcing the "discrete steps" motif.
- Avoid bouncy/elastic easing — this system reads as calm and financial; motion should feel precise, not playful.

---

## 8. Signature Element

**The segmented/dashed progress motif** — used for linear progress (tax reserve, budget bars) _and_ reimagined as a radial dashed gauge (financial pulse arcs). This discrete-tick language (rather than smooth continuous bars/arcs) is the one visual idea that repeats everywhere and should be treated as this system's fingerprint when extending it to new components.

---

## 9. Quick-reference Tailwind-style tokens

```css
:root {
    --color-bg-page: #f5f4f1;
    --color-bg-surface: #ffffff;
    --color-bg-subtle: #f2f1ee;
    --color-brand-green: #1f4b32;
    --color-brand-green-soft: #e7f0e5;
    --color-text-primary: #1b1b18;
    --color-text-secondary: #6e6e68;
    --color-text-tertiary: #a5a49e;
    --color-border-hairline: #e7e6e2;
    --color-track-inactive: #e3e2de;
    --color-status-positive: #2f6b3f;
    --color-status-negative: #b3492e;
    --color-status-negative-bg: #fbeae5;
    --color-status-warning: #c97a2b;
    --color-status-warning-bg: #fbeedf;

    --radius-card: 18px;
    --radius-tile: 12px;
    --radius-chip: 10px;
    --radius-pill: 9999px;

    --space-card-padding: 24px;
    --space-card-gap: 20px;

    --font-sans: 'Inter', 'General Sans', system-ui, sans-serif;
}
```
