# Avatars

> Dependencies: `colors.md`, `radius.md`

## Core Specs

- **Circular shape:** fully rounded (9999px)
- **Rounded square shape:** 6px radius
- **Default size:** 40x40px
- **Image fit:** cover
- **Border:** 2px solid black on all avatar shapes

## Sizes

| Size | Dimensions | Radius |
|---|---|---|
| Extra Small | 18x18px | 2px |
| Small | 24x24px | 2px |
| Base | 32x32px | 6px |
| Large | 44x44px | 6px |
| XL | 56x56px | 6px |
| 2XL | 64x64px | 6px |

## Bordered Avatar

- 4px padding, fully rounded, 2px solid black outline
- Alternative: 2px box-shadow ring in border-default color (black)

## Stacked Avatars

- Displayed in a row (flex)
- Each avatar: 40x40px, fully rounded, 2px solid black border
- Overlap: -16px negative margin on all except first

### Stacked Counter
- Same size as avatars (40x40px), fully rounded
- Background: dark-strong (black), text: white, 12px font, bold weight
- Same overlap margin as other avatars
- Border: 2px solid black

## Avatar with Text

- Flex row, 10px gap between avatar and text
- Avatar: 40x40px, fully rounded, cover fit, 2px solid black border
- Name: heading color, bold weight
- Subtitle: 14px, body color
