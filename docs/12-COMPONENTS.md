# Component Library (12-COMPONENTS.md)

## Objective
To establish a comprehensive specification for reusable UI components in the Entropic State Mod Manager, ensuring a consistent "True Dark Desktop" aesthetic and modular architecture.

## Responsibility
This document defines the structural, stylistic, and behavioral guidelines for all shared React components, serving as the blueprint for UI implementation.

## Scope
Covers the shared component library located at `src/renderer/shared/components/`, detailing design principles, specific component requirements (e.g., TitleBar, Button, Card, Modal), and the usage of Material Symbols Outlined. Excludes feature-specific components and business logic.

## Dependencies
- `11-FRONTEND.md` (Consumes these components for layout and features)
- Design system tokens (Colors, Typography) defined in global CSS variables

## Criteria for Completion
- Clear definition of component design principles.
- Detailed specifications for core layout components (TitleBar, SideNav, StatusBar).
- Detailed specifications for core UI elements (Button, Card, Input, Toggle, Chip, Modal, Toast, ProgressBar).
- Detailed specifications for complex UI patterns (GameCard, ModCard).
- Guidelines for iconography usage.

## Next Steps
- Setup global CSS variables for the color palette (`#131315` background, `#b5c4ff` / `#638aff` accent, Material Design 3 tokens).
- Implement foundational components (Button, Input, Card).
- Implement layout components (TitleBar, SideNav, StatusBar).

## Relation to Other Documents
Provides the visual building blocks necessary to execute the architecture defined in `11-FRONTEND.md`.

---

## Implementation Details

### Component Design Principles
- All components are functional React components with TypeScript
- Each component has its own directory: `ComponentName/ComponentName.tsx` + `ComponentName.css`
- Props interface: `[ComponentName]Props`
- Export from barrel file (`index.ts`)
- Use CSS custom properties for theming
- Support `className` prop for extension
- Use `forwardRef` for interactive elements

### Shared Components Specification

#### TitleBar
Custom window title bar replacing native frame.
- **Draggable region** for window movement (`-webkit-app-region: drag`)
- **App brand text** "Seeth's Mod Manager" (left)
- **Window controls**: minimize, maximize, close (right)
- **Height**: 48px, **background**: `var(--color-background)`
- **Border bottom**: 1px solid `var(--color-outline-variant)`
- **Note**: Navigation is handled exclusively by SideNav. TitleBar contains no navigation.

#### SideNav
Fixed left sidebar navigation.
- **Width**: 256px
- App icon + name + version (top)
- Navigation items with icons (Material Symbols Outlined, 20px)
- **Active item**: background highlight (`--color-surface-container`), primary color icon (filled), neutral text
- **Hover**: subtle background change (`--color-surface-container`)
- **Bottom section**: Support, Legal (separated by border-top)
- Scrollable if content overflows

#### StatusBar
Fixed bottom status bar.
- **Height**: 28px
- **Background**: `var(--color-surface-container-lowest)`
- **Left**: System status indicator (green dot + text), Sync status
- **Right**: Copyright text + version
- **Font**: mono-label (12px)

#### Button
**Variants:**
- **Primary**: `bg-primary`, `text-on-primary`, hover:`bg-primary-container`
- **Secondary/Outlined**: `border-outline-variant`, `text-on-surface`, hover:`bg-surface-variant`
- **Ghost**: no background, `text-on-surface-variant`, hover:`bg-surface-variant`
- **Danger**: hover:`text-error`, hover:`bg-error/10`

**Sizes:** 
- `sm` (py-1 px-2)
- `md` (py-2 px-4)
- `lg` (py-3 px-6)

With icon support (leading/trailing Material Symbols)

#### Card
- **Background**: `var(--color-surface)` or `var(--color-surface-container-low)`
- **Border**: 1px solid `var(--color-outline-variant)`
- **Border radius**: 8px (`rounded-lg`)
- No shadows (tonal layering only)
- Header slot with optional bottom separator

#### Input
- **Background**: `var(--color-surface-container)`
- **Border**: 1px solid `var(--color-outline-variant)`
- **Focus**: `border-primary`, `ring-primary`
- **Font**: body-sm (13px)
- Leading icon slot
- Placeholder in muted color

#### Toggle
- Custom toggle switch (not native checkbox)
- **States**: checked (`bg-primary`) / unchecked (`bg-surface-container-highest`)
- Smooth transition animation
- Accessible (`sr-only` checkbox input)

#### Chip / Tag
- Small pill-shaped labels
- **Background**: `var(--color-surface)` or transparent
- **Border**: 1px solid `var(--color-outline-variant)`
- **Font**: label-caps (11px, uppercase, tracking)
- **Active variant**: `border-primary`, `bg-primary/10`, `text-primary`

#### Modal
- **Overlay**: semi-transparent dark background
- Centered container with border and surface background
- Title + content + action buttons
- Close button (top-right)
- Escape key to close
- Focus trap

#### Toast / Notification
- Slide in from top-right
- **Variants**: info, success, warning, error
- Auto-dismiss (5 seconds default)
- Manual dismiss
- Stacking support

#### ProgressBar
- Thin horizontal bar
- Primary color for progress fill
- **Background**: `surface-variant`
- Support for indeterminate state
- Optional percentage text

#### GameCard
- Thumbnail image area with gradient overlay
- Status badge (INSTALLED / READY TO ADD)
- Game name, mod count, platform
- Action buttons (Manage / Setup Profile)
- Hover: image opacity/scale transitions

#### ModCard
- Thumbnail with category badge overlay
- Mod name + toggle switch
- Version + author info
- Footer: verification status + action buttons (delete)
- Disabled state: reduced opacity, grayscale thumbnail
- Update available state: top accent bar + update button

### Material Symbols Outlined
Use Google Material Symbols Outlined for all icons:
- **Default size**: 18px
- **Default weight**: 400
- **Active/filled state**: `font-variation-settings: 'FILL' 1`
- **Icons used**: dashboard, videogame_asset, inventory_2, explore, download, settings, terminal, help, policy, search, minimize, fullscreen, close, play_arrow, sync, extension, system_update, hard_drive, download_done, warning, check_circle, delete, add, folder_open, tune, chevron_left, chevron_right, star, more_vert, info, lock, arrow_upward, content_copy, view_in_ar, mop, grid_view, view_list
