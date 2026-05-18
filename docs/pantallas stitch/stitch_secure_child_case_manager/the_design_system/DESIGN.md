---
name: The Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f484b'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#70797c'
  outline-variant: '#bfc8cb'
  surface-tint: '#1e6777'
  primary: '#005768'
  on-primary: '#ffffff'
  primary-container: '#2a7081'
  on-primary-container: '#bcefff'
  inverse-primary: '#8fd0e3'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#724515'
  on-tertiary: '#ffffff'
  tertiary-container: '#8e5c2b'
  on-tertiary-container: '#ffe1ca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aeecff'
  primary-fixed-dim: '#8fd0e3'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5d'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#fab980'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#683c0d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-sm:
    fontFamily: manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: atkinsonHyperlegibleNext
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: atkinsonHyperlegibleNext
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-caps:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: manrope
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  container-max: 1280px
---

## Brand & Style

The design system is anchored in the principles of **Minimalism** and **Institutional Trust**. Given the sensitive nature of the NNyA (Niñas, Niños y Adolescentes) judicial and social context, the aesthetic intentionally avoids "clinical" coldness in favor of "serene" professionalism. 

The system prioritizes cognitive ease for educators and technical teams who manage high-stress data. The visual language is reductive but warm, utilizing generous whitespace to prevent information density from becoming overwhelming. Every design choice is filtered through the lens of security and discretion—ensuring that the interface feels like a safe harbor for critical information.

## Colors

The palette is dominated by "Serene Teal" (#2A7081), a muted, deep aquatic tone that signals stability and professional care without the aggressive energy of high-vibrancy blues. 

- **Primary (Serene Teal):** Reserved for primary actions, progress indicators, and key navigational focus.
- **Neutrals:** A range of soft grays and off-whites (Slate/Gray scales) create a tiered background system. This reduces eye strain during prolonged use.
- **Subtle Status:** Alerts do not use saturated reds or greens. Instead, they utilize desaturated "wash" backgrounds with slightly darker text to convey state without triggering alarm.
- **Surface:** The primary background is nearly white (#F8FAFC) to maintain a clean, breathable canvas.

## Typography

This design system employs a dual-font strategy to maximize both professionalism and accessibility:

1. **Manrope** is used for headings. Its geometric but slightly softened terminals provide a modern, organized feel for section titles and data headers.
2. **Atkinson Hyperlegible Next** is the primary choice for body text and data entry. Developed specifically for legibility, it ensures that sensitive identifiers and legal text are unmistakable, reducing human error.
3. **Inter** is used for utility labels and micro-copy, providing a neutral, systematic bridge between the two.

Line heights are intentionally loose (1.5x - 1.6x for body) to ensure that dense legal reports remain readable.

## Layout & Spacing

The layout utilizes a **Fixed-Fluid Hybrid Grid**. Content is housed within a centered container (max 1280px) to prevent line lengths from becoming too long on ultra-wide monitors used by administrative staff.

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column grid with 16px gutters.

Spacing follows a strict 4px baseline, with most component padding defaulting to 16px (md) or 24px (lg) to maintain the "generous whitespace" requirement. Information-heavy views (case lists) may drop to 12px internal padding but should maintain 24px external margins to avoid a cluttered feel.

## Elevation & Depth

To maintain a minimalist profile, the design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** #F8FAFC (Neutral).
- **Level 1 (Cards/Content):** White (#FFFFFF) with a 1px border of #E2E8F0. No shadow.
- **Level 2 (Active/Hover):** White with a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.03)) and a slightly darker border.
- **Modals:** Backdrop blur (8px) with a semi-transparent overlay (#1E293B at 20% opacity) to focus the user’s attention on the critical task while maintaining context of the system behind it.

## Shapes

The shape language is defined by **Medium Roundedness**. A radius of 8px (0.5rem) is the standard for cards and input fields. This softened geometry reduces the "institutional" harshness of the interface, making it feel more approachable for educators while retaining enough structure to look professional. 

Larger containers (e.g., main content areas) use a 16px (1rem) radius. Small elements like chips and tags use a fully pill-shaped radius (100px) to distinguish them from actionable buttons.

## Components

- **Cards:** The primary container. Cards should feature a subtle 1px border and no shadow. Headers within cards should have a light gray bottom-border to separate metadata from content.
- **Buttons:** 
  - *Primary:* Filled "Serene Teal" with white text. 
  - *Secondary:* Ghost style with "Serene Teal" border and text. 
  - *Tertiary:* Text-only for low-priority navigation.
- **Input Fields:** Use a light background (#F1F5F9) instead of a white background to clearly define the "editable" area. Labels are always persistent (never disappearing placeholders) to ensure users know exactly what sensitive data they are entering.
- **Chips/Status Indicators:** Used for case status (e.g., "Active," "Pending," "Resolved"). These use the soft status colors defined in the palette.
- **Data Privacy Shields:** A specific component for sensitive data (e.g., ID numbers or addresses). This includes a "blur-on-default" state with a toggle eye-icon to prevent accidental exposure of sensitive child data in shared workspaces.
- **Timeline:** A vertical line component with soft nodes to track judicial proceedings chronologically, using Serene Teal for the "current" state.