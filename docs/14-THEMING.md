# 14 - Design System and Theming

## Objective
To establish a cohesive, strict design language ("True Dark Desktop") for the Entropic State Mod Manager, ensuring a professional, non-distracting UI optimized for extended usage.

## Responsibility
This document dictates all UI and visual design decisions, including color palettes, typography, layout dimensions, component geometry (border radius, spacing), and CSS architecture.

## Scope
- Global color tokens (Material Design 3 adapted)
- Typography variables and font definitions
- Standardized spacing scales
- Layout constants for sidebar, titlebar, and statusbar
- Geometry rules (borders, elevation, radii)
- CSS conventions and styling approach (Vanilla CSS, custom properties)

## Dependencies
- `13-STATE.md`: UI store defines the state for toggling some layout aspects (e.g., sidebar collapse).
- Component architecture documents referencing global styles.

## Design Philosophy
"True Dark Desktop" - A minimalist, corporate modern aesthetic optimized for extended use sessions. No glassmorphism, no vibrant gradients, no decorative elements. The UI recedes to let content take center stage.

## Color System
Based on Material Design 3 color tokens, adapted for true dark:

```css
:root {
  /* Background layers (darkest to lightest) */
  --color-background: #131315;
  --color-surface: #131315;
  --color-surface-dim: #131315;
  --color-surface-container-lowest: #0e0e10;
  --color-surface-container-low: #1c1b1d;
  --color-surface-container: #201f22;
  --color-surface-container-high: #2a2a2c;
  --color-surface-container-highest: #353437;
  --color-surface-bright: #39393b;
  --color-surface-variant: #353437;
  
  /* Text colors */
  --color-on-surface: #e5e1e4;
  --color-on-surface-variant: #c3c5d7;
  --color-on-background: #e5e1e4;
  
  /* Primary accent (soft blue) */
  --color-primary: #b5c4ff;
  --color-on-primary: #00297a;
  --color-primary-container: #638aff;
  --color-on-primary-container: #00236c;
  --color-primary-fixed: #dbe1ff;
  --color-primary-fixed-dim: #b5c4ff;
  --color-inverse-primary: #1953d5;
  --color-surface-tint: #b5c4ff;
  
  /* Secondary (neutral) */
  --color-secondary: #c8c6c8;
  --color-on-secondary: #303032;
  --color-secondary-container: #474649;
  --color-on-secondary-container: #b7b4b7;
  
  /* Tertiary (neutral) */
  --color-tertiary: #c8c6c9;
  --color-on-tertiary: #303033;
  --color-tertiary-container: #919094;
  --color-on-tertiary-container: #29292c;
  
  /* Error */
  --color-error: #ffb4ab;
  --color-on-error: #690005;
  --color-error-container: #93000a;
  --color-on-error-container: #ffdad6;
  
  /* Outline / Borders */
  --color-outline: #8d90a0;
  --color-outline-variant: #434654;
  
  /* Inverse */
  --color-inverse-surface: #e5e1e4;
  --color-inverse-on-surface: #313032;
}
```

## Typography
Font: DM Sans (body), Outfit (display/headings), JetBrains Mono (code)

```css
:root {
  /* Typography */
  --font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Outfit', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  --text-display-lg: 700 32px/40px var(--font-display);  /* letter-spacing: -0.02em */
  --text-headline-md: 600 24px/32px var(--font-display);  /* letter-spacing: -0.01em */
  --text-title-sm: 600 16px/24px var(--font-display);
  --text-body-md: 400 14px/20px var(--font-family);
  --text-body-sm: 400 13px/18px var(--font-family);
  --text-body-xs: 400 12px/16px var(--font-family);
  --text-label-caps: 600 11px/16px var(--font-family);   /* letter-spacing: 0.05em, uppercase */
  --text-mono-label: 400 12px/16px var(--font-mono);
}
```
```

## Spacing
8px base unit system:
```css
:root {
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;     /* stack-gap */
  --spacing-3: 12px;
  --spacing-4: 16px;    /* gutter-md */
  --spacing-5: 20px;
  --spacing-6: 24px;    /* margin-lg */
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
}
```

## Layout Constants
```css
:root {
  --sidebar-width: 256px;
  --titlebar-height: 48px;
  --statusbar-height: 28px;
}
```

## Border Radius
```css
:root {
  --radius-sm: 2px;     /* 0.125rem */
  --radius-default: 4px; /* 0.25rem */
  --radius-md: 6px;     /* 0.375rem */
  --radius-lg: 8px;     /* 0.5rem */
  --radius-xl: 12px;    /* 0.75rem */
}
```
**CRITICAL RULE:** NO pill-shaped buttons. No border-radius > 12px except for circular indicators.

## Elevation
- NO box-shadows. EVER.
- Depth is communicated through color value (darker = further back)
- Borders define edges: `1px solid var(--color-outline-variant)`
- Active state: accent color or surface brightness shift

## Transitions
- Default: 150ms ease for colors and backgrounds
- Hover scale effects: 105% for images on cards, transition 300ms
- Active press: scale(0.95) for buttons, transition 100ms
- Use CSS transitions, not JS animations
- Scrollbar: custom styled with dark track and subtle thumb

## Scrollbar Styling
```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #131315; }
::-webkit-scrollbar-thumb { background: #353437; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #434654; }
```

## CSS Architecture
- Use CSS custom properties (variables) defined in `variables.css`.
- Use CSS modules (`.module.css`) for component scoping.
- Global styles in `shared/styles/`.
- Component styles co-located with component files.
- NO Tailwind CSS.
- NO CSS-in-JS.
- NO styled-components.
- Prefer semantic class names: `.mod-card`, `.side-nav-item`, `.status-badge`.

## Icon System
- Google Material Symbols Outlined
- Default: 18px size, weight 400, FILL 0
- Active/filled: `font-variation-settings: 'FILL' 1`
- Load via Google Fonts CDN or bundle locally for offline

## Criteria for Completion
- Variables CSS file correctly reflects all values listed here.
- Components strictly adhere to NO box-shadows, geometric corners, and specific spacing tokens.

## Next Steps
- Generate `variables.css` using the token values defined here.
- Set up global reset and scrolling rules.

## Relation to Other Documents
- Provides styling foundation for UI components relying on state defined in `13-STATE.md`.
