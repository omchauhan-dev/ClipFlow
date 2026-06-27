# Tooltips & Popovers

> Dependencies: `colors.md`, `radius.md`, `shadows.md`

## Tooltips

### Core Specs
- Padding: 12px horizontal, 8px vertical
- Font: 14px, bold weight
- Radius: 4px (default)
- Shadow: shadow-xs (2px 2px hard offset)
- Border: 2px solid black
- Transition: opacity, 300ms

### Dark (Default)
- Background: dark (black)
- Text: white
- Border: 2px solid black

### Light
- Background: neutral-primary-medium (white)
- Text: heading color
- Border: 2px solid black

## Popovers

### Core Specs
- Background: neutral-primary (white)
- Radius: 6px (base)
- Shadow: shadow-md (4px 4px hard offset)
- Border: 2px solid black (border-default)
- Transition: opacity, 300ms

### Header / Title
- Padding: 12px horizontal, 8px vertical
- Background: neutral-secondary-soft
- Bottom border: 2px solid black (border-default)
- Font: 14px, bold weight, heading color

### Body / Content
- Standard: 12px horizontal, 8px vertical padding; 14px, body color
- Rich: 16px padding; 14px, body color

## Arrows

- Size: 8x8px rotated 45deg
- Color must match the background of the tooltip/popover variant
- Border: 2px solid black on exposed edges

## Rules

- Tooltips: 4px radius, 2px solid black border
- Popovers: 6px radius, 2px solid black border
- Dark tooltips: dark background, white text
- Light tooltips/popovers: semantic neutral background + 2px solid black border
- Arrows match parent background color with black border on visible edges
