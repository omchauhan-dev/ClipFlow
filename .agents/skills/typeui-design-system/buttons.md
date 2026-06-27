# Buttons

> Dependencies: `colors.md`, `radius.md`, `shadows.md`

## Core Specs (every button except ghost and disabled)

- **Radius:** 6px (base) or 9999px for pills
- **Border:** 2px solid black (border-default)
- **Shadow:** shadow-xs (2px 2px 0px solid black)
- **Glint effect:** Every button except ghost and disabled gets a hard offset shadow that steps up on hover:
  - Default: `var(--shadow-xs)`
  - Hover: `var(--shadow-sm)` (shadow grows on hover for brutalist depth)
- **Font weight:** 700 (bold)
- **Font:** "Darker Grotesque"
- **Box sizing:** border-box
- **Transition:** background-color and shadow on hover

## Sizes

| Size | Font size | Horizontal padding | Vertical padding |
|---|---|---|---|
| Extra small | 12px | 12px | 6px |
| Small | 14px | 12px | 8px |
| Base (default) | 14px | 16px | 10px |
| Large | 16px | 20px | 12px |
| Extra large | 16px | 24px | 14px |

## Variants

### Brand
- **Background:** brand token
- **Border:** 2px solid black
- **Text:** black
- **Hover:** brand-strong background, shadow-sm
- **Focus ring:** 4px, brand-medium color
- **Glint:** yes

### Secondary
- **Background:** neutral-secondary-medium
- **Border:** 2px solid black
- **Text:** black
- **Hover:** neutral-tertiary-medium background, shadow-sm
- **Focus ring:** 4px, neutral-tertiary color
- **Glint:** yes

### Tertiary
- **Background:** neutral-primary-soft
- **Border:** 2px solid black
- **Text:** black
- **Hover:** neutral-secondary-medium background, shadow-sm
- **Focus ring:** 4px, neutral-tertiary-soft color
- **Glint:** yes

### Success
- **Background:** success token
- **Border:** 2px solid black
- **Text:** black
- **Hover:** success-strong background, shadow-sm
- **Focus ring:** 4px, success-medium color
- **Glint:** yes

### Danger
- **Background:** danger token
- **Border:** 2px solid black
- **Text:** white
- **Hover:** danger-strong background, shadow-sm
- **Focus ring:** 4px, danger-medium color
- **Glint:** yes

### Warning
- **Background:** warning token
- **Border:** 2px solid black
- **Text:** black
- **Hover:** warning-strong background, shadow-sm
- **Focus ring:** 4px, warning-medium color
- **Glint:** yes

### Dark
- **Background:** dark token
- **Border:** 2px solid black
- **Text:** white
- **Hover:** shadow-sm
- **Focus ring:** 4px, neutral-tertiary color
- **Glint:** yes

### Ghost (NO shadow, NO glint)
- **Background:** transparent
- **Border:** 2px solid black
- **Text:** heading color
- **Hover:** neutral-secondary-medium background
- **Focus ring:** 4px, neutral-tertiary color
- **No shadow, no glint effect**

### Disabled (NO shadow, NO glint)
- **Background:** disabled token
- **Border:** 2px solid border-default-medium
- **Text:** fg-disabled color
- **Cursor:** not-allowed
- **No hover, no focus, no shadow, no glint**

## Icons in Buttons

- Icon size: 16x16px
- Spacing: 8px gap between icon and label
- Layout: inline-flex, vertically centered
