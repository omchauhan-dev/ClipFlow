# Borders

## Width Scale

| Context | Width |
|---|---|
| Default (inputs, buttons, cards, containers) | 2px |
| Emphasis / focus | 3px |

## Rules

- Use solid borders by default — always solid black (border-default token) for the neo-brutalist aesthetic
- All visible component borders must be 2px solid black — this is the defining brutalist border style
- Dashed borders only for special cases like file dropzones
- Components in the same family must use matching border widths
- Never mix 2px and 3px borders within a single component

## Usage

| Context | Width |
|---|---|
| Inputs / selects / textareas | 2px default; 3px on focus or error |
| Buttons | 2px solid black on all variants |
| Cards / containers | 2px solid black |
