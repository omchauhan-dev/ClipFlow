# Shadows

| Token | CSS value |
|---|---|
| shadow-2xs | `1px 1px 0px rgba(0,0,0,1)` |
| shadow-xs | `2px 2px 0px rgba(0,0,0,1)` |
| shadow-sm | `3px 3px 0px rgba(0,0,0,1)` |
| shadow-md | `4px 4px 0px rgba(0,0,0,1)` |
| shadow-lg | `6px 6px 0px rgba(0,0,0,1)` |
| shadow-xl | `8px 8px 0px rgba(0,0,0,1)` |
| shadow-2xl | `12px 12px 0px rgba(0,0,0,1)` |

## Component Mapping

| Component type | Token |
|---|---|
| Subtle separators, tiny UI details | shadow-2xs or shadow-xs |
| Inputs, buttons, small controls, lightweight cards | shadow-xs or shadow-sm |
| Standard cards, popovers, dropdowns | shadow-md |
| Prominent cards, sticky surfaces | shadow-lg |
| Modals, high-priority overlays | shadow-xl |
| Hero overlays, top-level emphasis (sparingly) | shadow-2xl |

## Rules

- Use only these tokens — no custom box-shadow values
- All shadows are hard offset (no blur, no spread beyond offset) with solid black — this is the core brutalist shadow style
- Hover/focus on interactive elevated elements: step up by one level (e.g. shadow-sm → shadow-md)
- Components in the same family share the same baseline elevation
- Never stack multiple shadow tokens on one element
- Never use shadow-xl/shadow-2xl for dense list items or body containers
