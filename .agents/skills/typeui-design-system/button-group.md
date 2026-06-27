# Button Groups

> Dependencies: `buttons.md`, `colors.md`, `radius.md`

## Core Specs

- **Wrapper:** inline-flex, 6px radius, shadow-sm, 2px solid black border
- **Children overlap:** -2px left margin on all except first button (to account for 2px borders)
- **Buttons inside the group must NOT have individual shadows.** Only the wrapper has a shadow.

## Anatomy

### Wrapper
- Display: inline-flex
- Radius: 6px
- Shadow: shadow-sm
- Border: 2px solid black

### First Button
- 6px radius on inline-start side only, 0 on inline-end

### Middle Button(s)
- No radius (0 on all corners)

### Last Button
- 6px radius on inline-end side only, 0 on inline-start

### All buttons except first
- -2px left margin to overlap borders

## Rules

- Buttons inside groups follow all styles from `buttons.md` (background, border, focus rings) except individual shadows
- Icon-only buttons: 16x16px icon, match height of text buttons
