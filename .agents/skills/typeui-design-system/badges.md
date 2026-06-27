# Badges

> Dependencies: `colors.md`, `radius.md`

## Core Specs

- **Border:** 2px solid black
- **Default radius:** 4px
- **Pill radius:** 9999px

## Sizes

| Size | Font size | Horizontal padding | Vertical padding |
|---|---|---|---|
| Default (small) | 12px | 6px | 2px |
| Large | 14px | 8px | 4px |

## Variants

### Brand
- **Background:** brand-softer
- **Border:** 2px solid black
- **Text:** fg-brand-strong

### Alternative (Neutral Soft)
- **Background:** neutral-primary-soft
- **Border:** 2px solid black
- **Text:** heading

### Gray (Neutral Medium)
- **Background:** neutral-secondary-medium
- **Border:** 2px solid black
- **Text:** heading

### Danger
- **Background:** danger-soft
- **Border:** 2px solid black
- **Text:** fg-danger-strong

### Success
- **Background:** success-soft
- **Border:** 2px solid black
- **Text:** fg-success-strong

### Warning
- **Background:** warning-soft
- **Border:** 2px solid black
- **Text:** fg-warning

### Dark
- **Background:** dark
- **Border:** 2px solid black
- **Text:** white

## Pill Badges

Use 9999px radius instead of 4px on any variant.

## Badges with Icons

- Icon size (default): 12x12px
- Icon size (large): 14x14px
- Icon spacing: 4px margin next to label

## Icon-only Badge

Square shape — equalize dimensions to 24x24px, no horizontal text padding.

## Dismissible Badges

Badge content + a close button. Close button hover backgrounds per variant:

| Variant | Close button hover background |
|---|---|
| Brand | brand-soft |
| Alternative | neutral-tertiary |
| Gray | neutral-quaternary |
| Danger | danger-medium |
| Success | success-medium |
| Warning | warning-medium |

## Dot / Notification Badge

- Positioned absolutely: -4px top, -4px right
- Size: 12x12px, fully rounded
- 2px border in border-buffer color
- Background: danger
