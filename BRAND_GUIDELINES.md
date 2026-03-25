# GEN M & Z - Brand Guidelines

## 1. Logo Pack

### 1.1 Logo Variants

#### Primary Wordmark
- **Format**: SVG (preferred) / PNG
- **Versions**: Black, White, Primary Green
- **Location**: `/client/public/icons/logo.png`
- **Usage**: Header, navigation, brand center

#### Favicon & App Icons
- **Favicon**: `/client/public/favicon.png` (32x32)
- **Apple Touch Icon**: `/client/public/icons/apple-touch-icon.png` (180x180)
- **Android Icons**: 
  - `icon-192x192.png` (192x192)
  - `icon-512x512.png` (512x512)

### 1.2 Safe Area & Minimum Sizes

```
Clear Space (Minimum):
- Width: 1.5x the logo height
- Height: Equal to logo height

Minimum Sizes:
- Web header: 48px height
- Social media: 200px width
- Print materials: 50mm width
- Favicon: 32x32px minimum
```

### 1.3 Logo Usage Examples

**✅ Correct Usage**
- Centered in hero sections
- Left-aligned in headers/navigation
- Bottom-right on promotional materials
- Centered in footer sections

**❌ Avoid**
- Stretching or distorting
- Rotating at odd angles
- Placing on busy/patterned backgrounds
- Using without proper clear space
- Mixing with unrelated graphics
- Small sizes (<32px for web)

---

## 2. Colors & Typography

### 2.1 Color Palette

#### Primary Colors
```
Primary (Deep Green):
- Hex: #0D8659
- RGB: 13, 134, 89
- HSL: 161° 94% 30%
- Usage: CTAs, highlights, primary buttons, focus states
- Brand essence: Luxury, elegance, premium quality

Black (Text & Borders):
- Hex: #1A1A1A
- RGB: 26, 26, 26
- HSL: 0° 0% 10%
- Usage: Text, headlines, borders, structural elements

White (Background):
- Hex: #FFFFFF
- RGB: 255, 255, 255
- HSL: 0° 0% 100%
- Usage: Card backgrounds, clean spaces
```

#### Secondary Colors (Grays)
```
Gray-900 (Near Black):
- Hex: #111111
- Usage: Bold text, strong emphasis

Gray-700 (Dark Gray):
- Hex: #404040
- Usage: Secondary text, disabled states

Gray-500 (Medium Gray):
- Hex: #808080
- Usage: Tertiary text, subtle elements

Gray-300 (Light Gray):
- Hex: #D1D5DB
- Usage: Borders, dividers, subtle backgrounds

Gray-100 (Very Light):
- Hex: #F3F4F6
- Usage: Subtle backgrounds, hover states
```

#### Accent Colors (Optional)
```
Warm Accent (Amber - for special offers):
- Hex: #D97706
- HSL: 38° 92% 50%
- Usage: Sales badges, limited time offers

Cool Accent (Blue - for information):
- Hex: #3B82F6
- HSL: 217° 100% 62%
- Usage: Tips, information badges

Status Colors:
- Success: #22C55E (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)
- Info: #3B82F6 (Blue)
```

### 2.2 Typography System

#### Typeface: Cairo (Arabic & English)
- **Font Family**: Cairo
- **Import**: Google Fonts (already configured in index.css)
- **Weights**: 200, 300, 400, 500, 600, 700, 800, 900

#### Typography Hierarchy

```
Display (Hero Sections)
- Size: 3.5rem - 7rem (responsive, clamp)
- Weight: 900 (Black)
- Line Height: 0.9
- Letter Spacing: -0.02em
- Usage: Page titles, hero headlines

Heading 1 (Main Titles)
- Size: 2rem - 3.5rem (clamp)
- Weight: 800 (Extra Bold)
- Line Height: 1.1
- Letter Spacing: -0.01em
- Usage: Section headings, major titles

Heading 2 (Section Titles)
- Size: 1.5rem - 2.5rem (clamp)
- Weight: 700 (Bold)
- Line Height: 1.2
- Usage: Section headers, subsections

Heading 3 (Subsections)
- Size: 1.2rem - 1.875rem (clamp)
- Weight: 600 (Semi Bold)
- Line Height: 1.3
- Usage: Card titles, module headings

Body Text (Regular)
- Size: 1rem (16px)
- Weight: 400 (Regular)
- Line Height: 1.5 (24px)
- Letter Spacing: 0
- Usage: Main content paragraphs

Small Text / Labels
- Size: 0.875rem (14px)
- Weight: 500 (Medium)
- Line Height: 1.4
- Usage: Form labels, secondary info

Caption / Fine Print
- Size: 0.75rem (12px)
- Weight: 400 (Regular)
- Line Height: 1.3
- Usage: Timestamps, image captions, disclaimers

Monospace (Code / Data)
- Font: 'Monaco' or 'Courier New'
- Weight: 400
- Usage: IBAN numbers, SKUs, codes
```

#### Typography Rules

**✅ Best Practices**
- Use weight 600-900 for headings
- Limit line length to 60-80 characters for readability
- Maintain proper line height (1.5x for body text)
- Use weight 700+ for CTAs
- Ensure 4.5:1 contrast ratio for accessibility

**❌ Avoid**
- Mixing more than 2 typeface families
- Using weights <400 for body text
- Letter spacing on headings (use letter-spacing: normal)
- All caps for large body text
- Thin fonts (200-300) for body text

---

## 3. Brand Voice & Messaging

### 3.1 Brand Personality

**Gen M & Z Brand Voice:**
- ✨ Premium & Aspirational
- 🎯 Bold & Confident
- 💫 Contemporary & Forward-Thinking
- 🛍️ Customer-Centric
- 🌟 Sophisticated yet Approachable

### 3.2 Tone Guidelines

| Context | Tone | Examples |
|---------|------|----------|
| Product Descriptions | Elegant, Detailed | "Meticulously crafted hoodies designed for modern style" |
| CTAs | Direct, Action-Oriented | "Discover the Collection", "Shop Now", "Explore" |
| Error Messages | Helpful, Apologetic | "Something went wrong. Let's fix it." |
| Success Messages | Celebratory, Brief | "Order confirmed! You're on our way." |
| Help Text | Clear, Supportive | "Choose an address for delivery" |
| Navigation | Concise, Clear | Keep labels 1-2 words |
| Pricing | Transparent, Honest | Show total upfront, no hidden fees |

### 3.3 Prohibited Words & Phrases

**NEVER use:**
- "AI-powered" / "AI-driven" / "Artificial Intelligence"
- "Autopilot" / "Auto-magical" / "Magic"
- "Game-changer" / "Disruptive" / "Revolutionary"
- "Blockchain" / "Web3" / "Metaverse"
- "Cutting-edge technology"
- "One-click solution"
- "Zero-effort"
- "Powered by machine learning"
- "Click here" (use descriptive labels)
- "Submit" (use "Continue", "Next", "Place Order")

**Why?** These phrases feel generic, trendy, and undermine the premium brand positioning. We build quality products for real customers.

### 3.4 Preferred Core Messaging

**Taglines & Core Messages:**
- "Build Systems. Stay Human." (Philosophy)
- "Elegance That Speaks For You" (Brand statement)
- "Designed for Gen M & Z" (Target audience)
- "Premium Quality. Zero Compromise." (Promise)
- "Style Meets Substance" (Value proposition)
- "Exclusively Yours" (Premium positioning)

**Always emphasize:**
- Craftsmanship and quality
- Exclusivity and limited availability
- Customer experience
- Authenticity and realness
- Design innovation
- Cultural relevance

---

## 4. Visual Language

### 4.1 Photography & Imagery

**Photo Style:**
- Clean, minimalist compositions
- Natural lighting preferred
- High contrast for impact
- Authentic, lifestyle-focused
- Diverse representation
- Model diversity: different body types, ages, ethnicities

**Product Photography:**
- Clean white/solid backgrounds for product detail
- Lifestyle shots showing products in use
- Multiple angles and close-ups
- Consistent lighting across all images
- No overly filtered or heavily edited looks

### 4.2 Icons & Graphics

**Icon Guidelines:**
- Use Lucide icons for consistency
- Stroke weight: 2px (medium)
- Size: Maintain aspect ratios
- Color: Use primary green for interactive elements
- Never distort or stretch icons

**Graphic Elements:**
- Geometric shapes (preferred)
- Subtle gradients (optional)
- Borders and dividers: thin, understated
- No drop shadows unless floating effect needed
- Consistent border radius (6px for cards, 0-2px for small elements)

### 4.3 Imagery Examples

#### Hero Sections
- High-impact fashion photography
- Bold typography overlay
- Clear brand messaging
- Dark overlay gradient for readability

#### Card/Product Displays
- Clean, centered product image
- Minimal padding and borders
- Hover effects: subtle scale or shadow
- No intrusive badges or overlays

---

## 5. Design Systems & Components

### 5.1 Spacing Scale

```
0px   (0)
4px   (xs)
8px   (sm)
12px  (md)
16px  (lg)
24px  (xl)
32px  (2xl)
48px  (3xl)
64px  (4xl)
```

Use multiples of 4px for consistency. Avoid random pixel values.

### 5.2 Border Radius

```
Cards & Large Elements: 6px
Buttons & Inputs: 4px
Small Elements: 2px
Perfect Circles: 50%
```

### 5.3 Shadows

**Subtle Elevation:**
```
Small: 0 1px 2px rgba(0,0,0,0.05)
Medium: 0 4px 6px rgba(0,0,0,0.1)
Large: 0 20px 25px rgba(0,0,0,0.15)
```

**Purpose:** Only use for floating elements (modals, dropdowns, cards on hover)

### 5.4 Breakpoints

```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
Large Desktop: > 1280px
```

---

## 6. Application Examples

### 6.1 Header/Navigation
```
- Logo (white on dark, or vice versa)
- Navigation links: Weight 500-600
- CTA button: Primary green, weight 700
- Spacing: 16px padding vertical, 24px horizontal
```

### 6.2 Product Card
```
- Image: 3:4 aspect ratio
- Title: Heading 3, weight 700
- Price: Body text, weight 600
- Badge: Small text, weight 500, if applicable
- Border: 1px light gray
- Border radius: 6px
```

### 6.3 Form
```
- Labels: Weight 600, 12px
- Inputs: 44px height minimum (accessibility)
- Placeholder: Gray-500, weight 400
- Error text: Red (#EF4444), 12px
- Helper text: Gray-600, weight 400
```

### 6.4 Buttons

**Primary Button**
- Background: Primary Green (#0D8659)
- Text: White, weight 700
- Height: 44px minimum
- Padding: 12px 24px
- Border radius: 4px
- Hover: Darken 10%

**Secondary Button**
- Background: Gray-100
- Text: Black, weight 600
- Border: 1px Gray-300
- Same dimensions as primary

---

## 7. Accessibility Requirements

### 7.1 Color Contrast
- Text on background: 4.5:1 minimum (WCAG AA)
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

### 7.2 Typography Accessibility
- Minimum font size: 12px
- Line height: 1.4 minimum
- Letter spacing: ≥ 0.12em for extended text

### 7.3 Focus States
- Visible focus indicators on all interactive elements
- 2px solid primary green outline
- 4px offset from element border

---

## 8. Checklist for Brand Compliance

- [ ] Logo usage follows safe area guidelines
- [ ] Only approved colors are used
- [ ] Typography hierarchy is consistent
- [ ] No prohibited brand voice phrases present
- [ ] Appropriate tone for content type selected
- [ ] Images meet quality standards
- [ ] Buttons and CTAs are clear and actionable
- [ ] Contrast ratios meet WCAG AA standards
- [ ] Spacing uses 4px multiples
- [ ] Icons from approved library (Lucide)
- [ ] Border radius consistent with guidelines
- [ ] All links have proper hover states
- [ ] Mobile responsiveness tested
- [ ] Dark mode compatibility verified

---

## Questions & Updates

For brand guideline questions or updates, document changes with:
- **Date**: YYYY-MM-DD
- **Change**: What changed
- **Reason**: Why it changed
- **Approval**: Who approved

Last Updated: 2025-12-29
