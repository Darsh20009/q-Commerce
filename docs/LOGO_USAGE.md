# GEN M & Z - Logo Usage Guide

## Logo Specifications

### File Formats
- **SVG** (Preferred): Scalable, transparent background
- **PNG**: For web, 32x32px to 512x512px
- **Location**: `/client/public/icons/`

### Available Files
```
/client/public/icons/
├── logo.png              (Primary wordmark)
├── apple-touch-icon.png  (180x180, iOS)
├── icon-192x192.png      (Android)
├── icon-512x512.png      (Large Android)
└── favicon.png           (32x32, browser tab)
```

---

## Logo Variants

### Full Wordmark (Preferred)
- **"GEN M & Z"** in Cairo Bold
- **Subtitle**: "MODERN LUXURY" (optional)
- **Colors**: Black, White, or Primary Green
- **Aspect Ratio**: 16:9
- **Minimum Width**: 48px

### Icon Only (App Icon)
- **Square Format**: 1:1 aspect ratio
- **Usage**: Mobile apps, favicons
- **Sizes**: 32x32, 64x64, 128x128, 256x256, 512x512px
- **Colors**: Maintain brand colors

### Horizontal Layout
- **Logo + Text**: Side by side
- **Best for**: Headers, navigation
- **Aspect Ratio**: 3:1 to 4:1
- **Minimum Height**: 32px

### Vertical Layout
- **Logo Above Text**: Stacked
- **Best for**: Hero sections, footers
- **Minimum Width**: 80px

---

## Clear Space

### Minimum Spacing
```
Clear space = Logo height / 2
(Minimum distance from edges of text/graphics)

Example:
If logo is 100px tall
→ Maintain 50px clear space on all sides
```

### Do's & Don'ts
```
✅ DO:  Maintain clear space on all sides
✅ DO:  Keep aspect ratio intact
✅ DO:  Place on solid backgrounds

❌ DON'T: Rotate at angles
❌ DON'T: Add shadows or effects
❌ DON'T: Distort or skew
❌ DON'T: Place on busy backgrounds
❌ DON'T: Use without clear space
❌ DON'T: Make it too small (<32px)
```

---

## Minimum Sizes

| Use Case | Minimum Size | Format |
|----------|--------------|--------|
| Website Header | 48px | PNG/SVG |
| Navigation | 32px | PNG |
| Favicon | 32x32px | PNG |
| Mobile App | 192x192px | PNG |
| Social Media | 200x200px | PNG/SVG |
| Print Material | 50mm | EPS/PDF |
| Business Cards | 20mm | EPS/PDF |
| Billboards | 2m+ | Large format |

---

## Color Variations

### Light Background (White/Light Gray)
- Use **Black Logo** (#1A1A1A)
- Provides strong contrast
- Professional appearance

### Dark Background (Dark Gray/Black)
- Use **White Logo** (#FFFFFF)
- High contrast, easily readable
- Premium feel

### Colored Background
- Use **Primary Green Logo** (#0D8659)
- Only on light/neutral backgrounds
- Creates visual hierarchy

---

## Application Examples

### Header Navigation
```html
<!-- Horizontal layout, left-aligned -->
<img src="logo.png" alt="GEN M & Z" height="48px" />
```

### Hero Section
```html
<!-- Larger, centered -->
<img src="logo.png" alt="GEN M & Z" height="120px" class="mx-auto" />
```

### Footer
```html
<!-- Smaller, branded -->
<img src="logo.png" alt="GEN M & Z" height="40px" />
<p>Gen M & Z - Premium Fashion for Modern Style</p>
```

### Favicon
```html
<link rel="icon" type="image/png" href="/icons/favicon.png" sizes="32x32" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

### Android/PWA Icons
```html
<link rel="icon" type="image/png" href="/icons/icon-192x192.png" sizes="192x192" />
<link rel="icon" type="image/png" href="/icons/icon-512x512.png" sizes="512x512" />
```

### Social Media
```
Platform | Size | Recommended | Format
---------|------|-------------|--------
Twitter  | 200x200px | 200x200px | PNG
Instagram| 200x200px | 200x200px | PNG
Facebook | 200x200px | 200x200px | PNG
LinkedIn | 200x200px | 200x200px | PNG
```

---

## Responsive Logo

### Breakpoints
```
Mobile (<640px):      Logo height 32px
Tablet (640-1024px):  Logo height 40px
Desktop (>1024px):    Logo height 48px
```

### Implementation
```tsx
// Responsive logo component
<img 
  src="logo.png" 
  alt="GEN M & Z"
  className="h-8 sm:h-10 md:h-12"  // 32px, 40px, 48px
/>
```

---

## Accessibility

- ✅ Include `alt="GEN M & Z"` attribute
- ✅ Use SVG for scalability (no pixel distortion)
- ✅ Maintain high contrast on backgrounds
- ✅ Ensure logo is clickable to homepage
- ✅ Logo link should have `title="Go to homepage"`

---

## Technical Implementation

### Import in React
```tsx
import logo from '@assets/logo.png';

export function Header() {
  return (
    <div className="header">
      <img src={logo} alt="GEN M & Z" className="h-12" />
    </div>
  );
}
```

### SVG Version (If Available)
```tsx
import { Logo } from '@components/Logo';

export function Header() {
  return (
    <div className="header">
      <Logo width={48} height={48} />
    </div>
  );
}
```

---

## Common Mistakes to Avoid

| ❌ Mistake | ✅ Solution |
|-----------|----------|
| Logo too small | Use 48px minimum |
| No clear space | Maintain half-height spacing |
| Logo stretched | Keep aspect ratio |
| Logo rotated | Never rotate |
| Poor contrast | Use black on light, white on dark |
| Added effects | Keep logo simple |
| Wrong colors | Use approved colors only |

---

## Quality Checklist

Before deploying logo in any context:

- [ ] Clear space maintained
- [ ] Minimum size respected
- [ ] Correct file format used
- [ ] Aspect ratio preserved
- [ ] Color is approved variant
- [ ] No effects/shadows applied
- [ ] High resolution source used
- [ ] Alt text provided
- [ ] Contrast ratio adequate (4.5:1)
- [ ] Works in light and dark modes

---

## Updates & Variations

**Current Version**: v1.0 (2025-12-29)

To request logo variations or updates:
1. Document specific changes needed
2. Include context/use case
3. Provide approval from brand team
4. Update version number and date

---

Last Updated: 2025-12-29
