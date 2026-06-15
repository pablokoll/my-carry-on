# pablokoll Design System — Reference for Claude Code

This file describes the design system used across pablokoll projects.
When building UI, always follow these tokens, conventions, and patterns exactly.

---

## Loading the design system

Copy `colors_and_type.css` into the project root and link it:

```html
<link rel="stylesheet" href="./colors_and_type.css" />
```

For Astro/Tailwind projects, import it in the global stylesheet:

```css
@import "./colors_and_type.css";
```

---

## Typography

**Font stack (mono-first — no sans or serif):**
```css
font-family: "JetBrains Mono", "CaskaydiaMono Nerd Font", "Cascadia Code",
             "Cascadia Mono", ui-monospace, "SF Mono", Menlo, monospace;
/* token: var(--font-mono) */
```

Google Fonts import (add to <head>):
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cascadia+Code:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
```

**Type scale:**
| Token         | Size  | Use                    |
|---------------|-------|------------------------|
| `--fs-xs`     | 12px  | labels, badges         |
| `--fs-sm`     | 13px  | small body, meta       |
| `--fs-base`   | 15px  | body text              |
| `--fs-md`     | 17px  | comfortable body       |
| `--fs-lg`     | 20px  | h4, section labels     |
| `--fs-xl`     | 24px  | h3                     |
| `--fs-2xl`    | 32px  | h2                     |
| `--fs-3xl`    | 44px  | h1, hero               |
| `--fs-4xl`    | 60px  | display / hero only    |

**Font weights:** `--fw-regular` 400 · `--fw-medium` 500 · `--fw-semibold` 600 · `--fw-bold` 700

**Letter-spacing:** `--tracking-tight` -0.01em (headings) · `--tracking-wide` 0.04em (labels/badges)

---

## Color tokens

### Light theme (default)

**Surfaces:**
```
--bg              #ffffff   page background
--bg-surface      #f0f3f8   cards, badges, code blocks
--bg-hover        #e6eaf2   hover state backgrounds
--bg-rgb          255,255,255  for rgba() overlays
```

**Text:**
```
--fg              #1c2333   primary text
--fg-secondary    #3d4a63   body, descriptions
--fg-muted        #8896b0   comments, metadata, placeholders
```

**Borders:**
```
--border          #dde2ec   every border/divider
```

**Semantic accents:**
```
--accent          #4a7bb5   primary UI accent (steel blue)
--link            #5d8de5   hyperlinks (AA-passing on white)
--link-decorative #7aa2f7   decorative tokyo on gray surfaces
--cta             #e8304a   CTAs, danger, warnings
--success         #4db87a   available / online / success
--focus-ring      #4a7bb5   focus halo (use --shadow-focus)
```

**Extended palette (tags, progress bars, icons — use sparingly in light mode):**
```
--pk-mauve   #cba6f7   secondary tag
--pk-peach   #fab387   warm accent
--pk-yellow  #f9e2af   draft/wip tag
--pk-pink    #f38ba8   soft accent
--pk-mint    #a6e3a1   soft success
--pk-sky     #89b4fa   alternative blue
```

**Text utilities for extended colors (AA on white):**
```css
.fg-mauve  { color: #8e6dd9; }
.fg-peach  { color: #d27a3a; }
.fg-yellow { color: #b8860b; }
.fg-pink   { color: #d65d80; }
.fg-mint   { color: #4fa544; }
.fg-sky    { color: #4a8ce0; }
```

---

## Spacing scale

```
--space-1   4px
--space-2   8px
--space-3   12px
--space-4   16px
--space-5   20px
--space-6   24px
--space-8   32px
--space-10  40px
--space-12  48px
--space-16  64px
--space-20  80px
--space-24  96px
```

---

## Border radius

```
--radius-sm    6px    inputs, small elements
--radius       8px    buttons, inputs (default)
--radius-md    10px   cards
--radius-lg    12px   large cards
--radius-pill  99px   badges, chips, pills
```

---

## Elevation (shadows)

```
--shadow-xs      hairline — barely visible
--shadow-sm      subtle lift — hovered cards
--shadow-md      menus, popovers
--shadow-lg      modals, floating panels
--shadow-focus   0 0 0 3px rgba(74,123,181,.20) — focus state
```

---

## Component patterns

### Buttons

```html
<!-- Primary -->
<button class="btn btn-primary">view_projects()</button>

<!-- Secondary / ghost -->
<button class="btn btn-secondary">$ contact --email</button>

<!-- Danger -->
<button class="btn btn-danger">$ deploy --prod</button>

<!-- Link -->
<button class="btn btn-link">$ github --profile →</button>
```

CSS:
```css
.btn {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 18px;
  border-radius: var(--radius);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-2) var(--ease);
}
.btn-primary   { background: var(--accent); color: white; }
.btn-primary:hover { background: var(--pk-steel-hover); }
.btn-secondary { background: transparent; color: var(--fg); border-color: var(--border); }
.btn-secondary:hover { background: var(--bg-surface); }
.btn-danger    { background: var(--cta); color: white; }
.btn-danger:hover { background: var(--pk-crimson-hover); }
.btn-link      { background: transparent; color: var(--link); padding: 10px 4px; }
.btn-link:hover { color: var(--pk-tokyo-hover); text-decoration: underline; }
```

### Cards

Use the built-in `.card` utility class from `colors_and_type.css`:

```html
<!-- Static card -->
<div class="card" style="padding: 20px;">...</div>

<!-- Hoverable card (lifts on hover) -->
<div class="card card-hover" style="padding: 20px;">...</div>

<!-- Surface card (gray-50 bg) -->
<div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px;">...</div>
```

### Badges / chips

```html
<!-- Default chip -->
<span class="badge">IN PROGRESS</span>

<!-- Outline with color -->
<span class="badge badge-outline" style="--badge-color: var(--pk-sky);">DAILY</span>
```

CSS:
```css
.badge {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  background: var(--bg-surface);
  color: var(--fg-secondary);
}
.badge-outline {
  background: transparent;
  color: var(--badge-color, var(--accent));
  border-color: var(--badge-color, var(--accent));
}
```

### Progress bar

```html
<div style="background: var(--bg-surface); border-radius: 99px; height: 4px;">
  <div style="background: var(--pk-sky); width: 35%; height: 100%; border-radius: 99px;"></div>
</div>
<span class="comment" style="font-size: 12px;">progress: 35%</span>
```

---

## Design conventions

### Naming
All section titles, IDs, variable names, and labels be **user friendly**:
```
work_experience    technical_stack    learning_golang    ai_tools_mastery
```

### CLI / terminal aesthetic
- Comments use `// ` prefix in muted italic → class: `.comment` or `.subline`
- CTAs/links use `$ ` prefix → class: `.prompt`
- Function-style labels: `view_projects()`, `get_in_touch()`

```css
/* These classes come from colors_and_type.css */
.comment::before, .subline::before { content: "// "; }
.prompt::before  { content: "$ ";  color: var(--fg-muted); }
```

### Hover interactions
- Cards: `translateY(-2px)` + `--shadow-md` (use `.card-hover`)
- Links: underline + color shift to `--pk-tokyo-hover`
- Buttons: darker bg variant, no scale transforms
- Duration: `var(--duration-2)` (180ms), easing: `var(--ease)` (cubic-bezier(0.2,0.8,0.2,1))

### Tech stack tags
```html
<span style="font-size: 12px; padding: 3px 8px; border-radius: 6px;
             background: var(--bg-surface); color: var(--fg); border: 1px solid var(--border);">
  TypeScript
</span>
```

### Smooth theme transitions
Add `.theme-transitioning` class to `<html>` for 250ms before/after toggling `data-theme`:
```js
document.documentElement.classList.add('theme-transitioning');
document.documentElement.setAttribute('data-theme', next);
setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300);
```

---

## Motion

```
--ease        cubic-bezier(0.2, 0.8, 0.2, 1)
--duration-1  120ms   micro (icon swap, badge appear)
--duration-2  180ms   default (hover, button press)
--duration-3  240ms   page transitions, card expand
```

No bounces. No infinite loops on content. Prefer opacity/transform over layout changes.

---

## Tailwind v4 integration

The `global.css` in the portfolio is a Tailwind v4 `@theme` block.
All `--pk-*` tokens are available as Tailwind utilities:
```html
<div class="bg-ctp-base text-ctp-text">  <!-- Catppuccin mocha colors -->
<div class="text-[var(--fg)]">           <!-- semantic tokens via arbitrary value -->
```

Use semantic CSS variables in component styles, not raw Catppuccin tokens directly.
