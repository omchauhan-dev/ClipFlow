# Layout & Spacing

## Spacing Rhythm

Base unit: **8px**. All spacing values should be multiples of 8px.

| Context | Value |
|---|---|
| Section vertical padding | 96px |
| Section header → content | 48px or 64px |
| Heading → paragraph | 16px |
| Container horizontal padding | 24px |
| Flex/grid row gap | 16px |
| Card grid gap | 24px |
| Wide component grid gap | 32px |
| Column layout gap | 48px |

## Container

Standard section container: max-width 1152px, centered, 24px horizontal padding.

Every major section wraps content in this container.

## Content Composition Order

Inside each section, follow this order:
1. Heading (`h1`–`h3`)
2. Leading paragraph
3. Normal paragraph(s)
4. Lists, CTA links, or component grids

## Section Pattern

Each section has:
- 96px vertical padding
- A background color — alternate between neutral-primary-soft (white) and vivid section-* colors from the color tokens for a bold, colorful brutalist layout
- A 2px solid black border on the top and/or bottom edges to separate sections
- A centered container (max-width 1152px, 24px horizontal padding)
- A section header area with 48px bottom margin
- Section content below

### Colorful Brutalist Sections
Sections should cycle through vivid background colors to create the eye-catching, playful neo-brutalist aesthetic seen on the reference site. Use the section-* color tokens (section-brand, section-secondary, section-cyan, section-purple, section-green, section-pink, section-blue, section-yellow) as section backgrounds. Alternate white sections with colored sections. When a section uses a vivid background:
- Text must remain high-contrast (heading color for titles, body color for paragraphs)
- All borders stay 2px solid black
- Cards and components inside colored sections keep their white (neutral-primary-soft) backgrounds with 2px solid black borders, creating contrast against the vivid section background
- Hard offset shadows remain solid black

## Motion & Animation

- Prefer CSS-native: `transition`, `animation`, `@keyframes`. Use Motion library only when CSS cannot achieve the behavior.
- Keep animations bold and snappy — fast transitions (150ms–200ms) with no easing or linear easing for a raw, mechanical brutalist feel.
- Reserve scroll-triggered and hover transitions for moments that reinforce hierarchy or reward attention.

## Backgrounds & Visual Depth

- Default to flat, bold, high-contrast backgrounds — avoid gradients, blurs, or soft atmospheric effects.
- Use solid vivid colors from the section-* token palette for section backgrounds.
- Depth comes from hard offset shadows and thick black borders, not from opacity or blur.
- Every decorative element must serve a compositional purpose (separation, emphasis, or visual rhythm). No soft or ornamental effects competing with content.

## Must

- All sections: consistent 96px vertical padding
- All containers: max-width 1152px, centered, 24px horizontal padding
- Section headers: 48px or 64px bottom margin
- Consistent vertical rhythm, no crowded sections
- Layouts readable and properly spaced on both desktop and mobile
- Sections alternate between white and vivid colors for the colorful brutalist feel
- All section dividers: 2px solid black borders
