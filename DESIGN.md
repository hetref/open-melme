# MelMe Design System & Theme Guidelines

A comprehensive design system documentation for the MelMe landing page. Use this guide to create consistent pages and components that match the established visual language.

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Animations & Interactions](#animations--interactions)
6. [CSS Utilities & Custom Classes](#css-utilities--custom-classes)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [File Structure](#file-structure)
10. [Usage Examples](#usage-examples)

---

## Color System

### Design Philosophy

The MelMe theme uses a **violet-accented design** with both light and dark mode support. The color palette is intentionally limited to 4-5 colors to maintain visual cohesion.

### Light Mode (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#fafafa` | Page background |
| `--surface` | `#ffffff` | Card/container backgrounds |
| `--surface-raised` | `#f4f4f5` | Elevated surfaces, hover states |
| `--border` | `rgba(0, 0, 0, 0.08)` | Borders, dividers |
| `--primary` | `#7C3AED` | Primary accent, CTAs, links |
| `--primary-hover` | `#8B4CF7` | Primary hover state |
| `--accent-light` | `#A78BFF` | Light accent, highlights |
| `--accent-glow` | `rgba(124, 58, 237, 0.18)` | Glow effects, shadows |
| `--foreground` | `#18181b` | Primary text |
| `--foreground-dim` | `#52525b` | Secondary text |
| `--muted` | `#a1a1aa` | Tertiary text, placeholders |

### Dark Mode (`.dark`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#08080e` | Page background (deep violet-black) |
| `--surface` | `#0f0f1a` | Card/container backgrounds |
| `--surface-raised` | `#141424` | Elevated surfaces |
| `--border` | `rgba(255, 255, 255, 0.06)` | Borders, dividers |
| `--primary` | `#7C3AED` | Primary accent (consistent) |
| `--primary-hover` | `#8B4CF7` | Primary hover state |
| `--accent-light` | `#A78BFF` | Light accent |
| `--accent-glow` | `rgba(124, 58, 237, 0.28)` | Glow effects (stronger in dark) |
| `--foreground` | `#f0eeff` | Primary text (soft white with violet tint) |
| `--foreground-dim` | `#9b96b8` | Secondary text |
| `--muted` | `#5c5880` | Tertiary text |

### Semantic Color Tokens (shadcn Compatible)

```css
--card: var(--surface);
--card-foreground: var(--foreground);
--popover: var(--surface);
--popover-foreground: var(--foreground);
--primary-foreground: #ffffff; /* Light: white, Dark: #f0eeff */
--secondary: var(--surface-raised);
--secondary-foreground: var(--foreground);
--muted-foreground: var(--foreground-dim);
--accent: var(--primary);
--accent-foreground: #ffffff;
--destructive: #ef4444;
--destructive-foreground: #ffffff;
--input: var(--border);
--ring: var(--primary);
--radius: 0.625rem; /* 10px base radius */
```

### Usage in Tailwind

```tsx
// Backgrounds
className="bg-background"      // Page background
className="bg-surface"         // Cards, containers
className="bg-surface-raised"  // Elevated elements, hover

// Text
className="text-foreground"      // Primary text
className="text-foreground-dim"  // Secondary text
className="text-muted"           // Tertiary/placeholder text
className="text-accent-light"    // Accent text (links, highlights)

// Borders
className="border-border"        // Standard borders
className="border-border/50"     // Subtle borders (50% opacity)

// Primary accent
className="bg-primary"           // Primary buttons, badges
className="text-primary"         // Primary text accent
className="hover:bg-primary-hover" // Hover states
```

### Gradient Text

```tsx
// CSS class for gradient text effect
className="gradient-text"

// Renders as:
// background: linear-gradient(135deg, var(--accent-light), var(--primary));
// with text fill
```

---

## Typography

### Font Families

| Font | Variable | Usage |
|------|----------|-------|
| **Bricolage Grotesque** | `--font-display` | Headlines, section titles, logo |
| **DM Sans** | `--font-sans` | Body text, UI elements (default) |
| **Geist Mono** | `--font-mono` | Code, technical content |

### Font Setup (Next.js)

```tsx
// layout.tsx
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'

const bricolage = Bricolage_Grotesque({ 
  subsets: ["latin"],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
})

// Apply to body
<body className={`${bricolage.variable} ${dmSans.variable} font-sans antialiased`}>
```

### Type Scale

| Element | Mobile | Desktop | Weight | Font |
|---------|--------|---------|--------|------|
| H1 (Hero) | `text-4xl` (36px) | `text-6xl xl:text-[72px]` | Bold (700) | Display |
| H2 (Section) | `text-3xl` (30px) | `text-[44px]` | Bold (700) | Display |
| H3 (Card Title) | `text-xl` (20px) | `text-2xl` (24px) | Semibold (600) | Display |
| Body Large | `text-lg` (18px) | `text-lg` | Normal (400) | Sans |
| Body | `text-sm` (14px) | `text-base` (16px) | Normal (400) | Sans |
| Small/Caption | `text-xs` (12px) | `text-sm` (14px) | Medium (500) | Sans |
| Overline | `text-[11px]` | `text-[11px]` | Medium (500) | Sans |

### Typography Patterns

```tsx
// Hero headline
<h1 className="font-[var(--font-display)] text-4xl sm:text-5xl lg:text-6xl xl:text-[72px] font-bold leading-[1.1] text-foreground">

// Section headline
<h2 className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold text-foreground">

// Overline/Label
<p className="text-[11px] uppercase tracking-[0.15em] text-accent-light/60 font-medium">

// Body paragraph
<p className="text-lg text-foreground-dim leading-relaxed">

// Small muted text
<span className="text-muted text-xs">
```

---

## Spacing & Layout

### Container Widths

| Class | Width | Usage |
|-------|-------|-------|
| `max-w-7xl` | 1280px | Main content container |
| `max-w-4xl` | 896px | Narrow content (CTA, forms) |
| `max-w-xl` | 576px | Very narrow (text blocks) |

### Standard Padding

```tsx
// Page sections
className="px-6"              // Horizontal padding (all screens)
className="py-20 lg:py-32"    // Vertical section padding

// Container pattern
<div className="max-w-7xl mx-auto px-6">
```

### Section Spacing

| Element | Value |
|---------|-------|
| Section padding | `py-20 lg:py-32` (80px / 128px) |
| Section gap | `gap-12 lg:gap-16` (48px / 64px) |
| Card padding | `p-4 sm:p-6` (16px / 24px) |
| Element gap | `gap-4` (16px) standard |

### Grid System

```tsx
// Two-column layout
<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

// Feature grid (responsive)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Bento-style grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
```

---

## Components

### Buttons

#### Primary Button
```tsx
<button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-base transition-all hover:bg-primary-hover hover:shadow-[0_0_24px_var(--accent-glow)] inline-flex items-center gap-2">
  Get Started
  <ArrowRight size={18} />
</button>
```

#### Secondary/Ghost Button
```tsx
<button className="border border-border text-foreground px-6 py-3 rounded-lg font-medium text-base transition-all hover:border-primary inline-flex items-center gap-2">
  Learn More
</button>
```

#### Pill Button (Navbar)
```tsx
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-hover transition-all">
  Sign Up
</button>
```

### Cards

#### Standard Card
```tsx
<div className="bg-surface-raised border border-border rounded-2xl p-6">
  {/* Content */}
</div>
```

#### Feature Card (with hover)
```tsx
<motion.div
  whileHover={{ y: -4, borderColor: "var(--primary)" }}
  className="bg-surface border border-border rounded-2xl p-6 transition-all"
>
  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
    <Icon size={24} className="text-accent-light" />
  </div>
  <h3 className="font-[var(--font-display)] text-xl font-semibold text-foreground mb-2">
    Title
  </h3>
  <p className="text-foreground-dim text-sm leading-relaxed">
    Description text
  </p>
</motion.div>
```

#### Glass Card (floating navbar, modals)
```tsx
<div className="bg-surface/95 backdrop-blur-xl border border-border shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-2xl">
```

### Badges

#### Announcement Badge
```tsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10">
  <span className="text-accent-light text-sm font-medium">New Feature</span>
  <ArrowRight size={14} className="text-accent-light" />
</div>
```

#### Status Badge
```tsx
<span className="text-[10px] uppercase tracking-wider text-accent-light bg-primary/10 px-2 py-1 rounded">
  Active
</span>
```

### Form Inputs

```tsx
<input 
  type="text"
  placeholder="Enter your email"
  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors"
/>
```

### Icons

- Use **Lucide React** icons
- Standard sizes: `16px`, `20px`, `24px`
- Color: `text-accent-light` for accent, `text-foreground` for standard, `text-muted` for subdued

```tsx
import { Mail, ArrowRight, Check } from "lucide-react"

// Icon in button
<ArrowRight size={18} className="text-primary-foreground" />

// Icon with background
<div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
  <Mail size={20} className="text-accent-light" />
</div>
```

---

## Animations & Interactions

### Animation Libraries

- **Framer Motion**: Page transitions, component animations, gestures
- **GSAP + ScrollTrigger**: Scroll-based animations, horizontal scroll
- **tw-animate-css**: Tailwind-based utility animations

### Standard Motion Variants

#### Fade In Up
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

#### Staggered Children
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

#### Hover Scale
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

#### GSAP Word Animation
```tsx
useEffect(() => {
  const words = ref.current.querySelectorAll(".word")
  gsap.from(words, {
    y: 70,
    opacity: 0,
    stagger: 0.065,
    duration: 1,
    ease: "power4.out",
    delay: 0.3,
  })
}, [])

// HTML structure
<h1>
  <span className="word inline-block">Your</span>{" "}
  <span className="word inline-block gradient-text">Domain.</span>
</h1>
```

### Custom UI Components (MagicUI/Aceternity-style)

| Component | File | Usage |
|-----------|------|-------|
| `AnimatedThemeToggler` | `ui/animated-theme-toggler.tsx` | Dark/light mode toggle with View Transition API |
| `EncryptedText` | `ui/encrypted-text.tsx` | Text reveal with scramble effect |
| `TextAnimate` | `ui/text-animate.tsx` | Text animations (fadeIn, blurInUp, slideUp, etc.) |
| `MorphingText` | `ui/morphing-text.tsx` | Text that morphs between strings |
| `SpinningText` | `ui/spinning-text.tsx` | Circular spinning text badge |
| `SmoothCursor` | `ui/smooth-cursor.tsx` | Custom physics-based cursor |
| `ProgressiveBlur` | `ui/progressive-blur.tsx` | Edge blur effect for scroll containers |
| `ScrollProgress` | `ui/scroll-progress.tsx` | Scroll progress indicator |

### Glow Orb Animations (Background)

```tsx
// CSS animations defined in globals.css
<div 
  className="glow-orb-1 absolute w-[600px] h-[600px] rounded-full"
  style={{ background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)" }}
/>

// Animation keyframes: float-1, float-2, float-3
// Classes: glow-orb-1, glow-orb-2, glow-orb-3
```

### Pulse Animation (Status Dots)

```tsx
<div className="w-2 h-2 rounded-full bg-[#22c55e] pulse-dot" />

// CSS keyframe: pulse-dot (scale 1 → 1.4 → 1, opacity 1 → 0.6 → 1)
```

### Marquee Animation

```tsx
<div className="animate-marquee">
  {/* Content duplicated for seamless loop */}
</div>

// CSS: transform: translateX(0) → translateX(-50%), 22s linear infinite
```

---

## CSS Utilities & Custom Classes

### Global Styles (globals.css)

```css
/* Smooth scrolling */
html { scroll-behavior: smooth; }

/* Hide scrollbar (for horizontal scroll sections) */
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, var(--accent-light), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Custom cursor (landing page only) */
.cursor-none, .cursor-none * { cursor: none !important; }
.cursor-none input, .cursor-none textarea { cursor: text !important; }

/* Grain overlay */
.grain-overlay { /* SVG noise texture at 3% opacity */ }

/* Smooth theme transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

### Custom Scrollbar

```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--background); }
::-webkit-scrollbar-thumb { background: var(--surface-raised); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }
```

### Focus Styles

```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Text Selection

```css
::selection {
  background: var(--primary);
  color: var(--primary-foreground);
}
```

---

## Responsive Design

### Breakpoints (Tailwind defaults)

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile first |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

### Common Responsive Patterns

```tsx
// Typography scaling
className="text-3xl sm:text-4xl lg:text-[44px]"

// Padding scaling
className="px-4 sm:px-6 lg:px-8"
className="py-16 lg:py-24"

// Grid columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Show/hide
className="hidden lg:block"    // Desktop only
className="lg:hidden"          // Mobile only

// Flex direction
className="flex flex-col lg:flex-row"

// Gap scaling
className="gap-4 lg:gap-6"
```

### Mobile-Specific Adjustments

- Reduce font sizes by 1-2 steps
- Stack layouts vertically
- Increase touch targets (min 44px)
- Hide decorative elements (SpinningText, glow orbs)
- Use `line-clamp-1` or `line-clamp-2` for text truncation
- Add `overflow-hidden` to prevent horizontal scroll

---

## Accessibility

### Color Contrast

- All text maintains WCAG AA contrast ratio (4.5:1 for normal text)
- Light mode: Dark text (#18181b) on light backgrounds (#fafafa)
- Dark mode: Light text (#f0eeff) on dark backgrounds (#08080e)

### Focus States

```tsx
// All interactive elements should have visible focus
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
// or use :focus-visible for keyboard-only focus
```

### ARIA Labels

```tsx
// Icon-only buttons
<button aria-label="Toggle menu">
  <Menu size={24} />
</button>

// Decorative icons
<ArrowRight aria-hidden="true" />
```

### Reduced Motion

```tsx
// Respect user preferences
const prefersReducedMotion = useReducedMotion()

<motion.div
  animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
>
```

### Screen Reader Text

```tsx
<span className="sr-only">Current step: 2 of 5</span>
```

---

## File Structure

```
├── app/
│   ├── globals.css          # Theme tokens, custom utilities
│   ├── layout.tsx           # Fonts, metadata, theme script
│   └── page.tsx             # Landing page assembly
│
├── components/
│   ├── landing/
│   │   ├── navigation.tsx   # Floating navbar with scroll progress
│   │   ├── hero.tsx         # Hero section with animations
│   │   ├── trust-marquee.tsx
│   │   ├── pain-solution.tsx
│   │   ├── feature-grid.tsx
│   │   ├── how-it-works.tsx # Horizontal scroll with GSAP
│   │   ├── mailbox-showcase.tsx
│   │   ├── security.tsx
│   │   ├── pricing.tsx
│   │   ├── final-cta.tsx
│   │   └── footer.tsx
│   │
│   └── ui/
│       ├── animated-theme-toggler.tsx
│       ├── encrypted-text.tsx
│       ├── text-animate.tsx
│       ├── morphing-text.tsx
│       ├── spinning-text.tsx
│       ├── smooth-cursor.tsx
│       ├── progressive-blur.tsx
│       ├── scroll-progress.tsx
│       └── [shadcn components...]
│
└── lib/
    └── utils.ts             # cn() utility function
```

---

## Usage Examples

### Creating a New Section

```tsx
"use client"

import { motion } from "framer-motion"
import { TextAnimate } from "@/components/ui/text-animate"

export function NewSection() {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] uppercase tracking-[0.15em] text-accent-light/60 mb-2 font-medium"
          >
            Section Label
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-[44px] font-bold text-foreground mb-4"
          >
            <TextAnimate animation="blurInUp" by="word" once>
              Section Headline Here
            </TextAnimate>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-foreground-dim text-lg max-w-2xl mx-auto"
          >
            Supporting description text that explains this section.
          </motion.p>
        </div>

        {/* Section Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cards, content, etc. */}
        </div>
      </div>
    </section>
  )
}
```

### Creating a New Card Component

```tsx
"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  index?: number
}

export function FeatureCard({ icon: Icon, title, description, index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, borderColor: "var(--primary)" }}
      className="bg-surface border border-border rounded-2xl p-6 transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
        <Icon size={24} className="text-accent-light" />
      </div>
      <h3 className="font-[var(--font-display)] text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-foreground-dim text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  )
}
```

---

## Theme Toggle Implementation

```tsx
// Theme toggle saves to localStorage
const toggleTheme = () => {
  const isDark = document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

// Theme initialization (in layout.tsx head)
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      var savedTheme = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = savedTheme || (prefersDark ? 'dark' : 'dark');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    })();
  `,
}} />
```

---

## Dependencies

```json
{
  "dependencies": {
    "framer-motion": "^11.x",
    "gsap": "^3.x",
    "lucide-react": "^0.x",
    "next": "^15.x or ^16.x",
    "react": "^19.x",
    "tailwindcss": "^4.x",
    "tw-animate-css": "^1.x"
  }
}
```

---

## Quick Reference

### Essential Classes

```tsx
// Backgrounds
bg-background, bg-surface, bg-surface-raised, bg-primary, bg-primary/10, bg-primary/15

// Text
text-foreground, text-foreground-dim, text-muted, text-accent-light, text-primary

// Borders
border-border, border-border/50, border-primary, border-primary/40

// Shadows
shadow-lg, shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]

// Border radius
rounded-lg (10px), rounded-xl (12px), rounded-2xl (16px), rounded-full

// Backdrop
backdrop-blur-sm, backdrop-blur-xl

// Font
font-sans (DM Sans), font-[var(--font-display)] (Bricolage Grotesque)
```

---

*Last updated: May 2025*
*Version: 1.0.0*
