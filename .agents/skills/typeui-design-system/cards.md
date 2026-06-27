# Cards

> Dependencies: `colors.md`, `radius.md`, `shadows.md`, `typography.md`

## Core Specs

- **Background:** neutral-primary-soft (white)
- **Border:** 2px solid black (border-default)
- **Radius:** 6px (base)
- **Shadow:** shadow-sm (3px 3px hard offset)

## Card Heading

- Desktop: 20px, bold weight, heading color
- Mobile: 16px, bold weight, heading color
- Never skip heading levels — the page hierarchy must logically arrive at the card heading level.

## States

### Static Card (no interactivity)
- Background: neutral-primary-soft
- Border: 2px solid black (border-default)
- Radius: 6px
- Shadow: shadow-sm
- No hover styles. Non-interactive cards must NOT have hover background changes.

### Interactive Card (clickable)
- Same base styles as static card
- Hover: shadow-xl (8px 8px hard offset), slight translate for brutalist pop effect
- Transition: shadow, transform
- Cursor: pointer

## Rules

- Background: neutral-primary-soft
- Border: 2px solid black (border-default)
- Radius: 6px
- Shadow: shadow-sm
- Interactive hover: shadow-xl (8px 8px 0px black) — matching the reference card hover
- Non-interactive: no hover styles
- Card images/figures: separated by a 2px solid black bottom border inside the card
