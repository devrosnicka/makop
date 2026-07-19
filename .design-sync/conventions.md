## Makop UI — conventions

Makop is a **dark-first app with no light theme**. There is no theme
provider, no `.dark`/`.light` class toggle to apply, and no prop that
switches modes — the tokens below already describe the one and only theme.

### Wrap every composition in the dark canvas

Nothing in this library sets a page-level background — that's the host
page's job, and in the real app it's always dark. If you compose these
components into a new screen without an explicit dark wrapper, anything that
relies on inherited (rather than explicit) text color — e.g. a `ghost`
button, a bare `Label`, table cell text — renders **white text with no
background under it**, which is invisible on a plain white canvas. Always
wrap top-level compositions like this:

```jsx
<div className="bg-background text-foreground p-6">
  {/* your composition */}
</div>
```

`Card`, `Alert`, and `DropdownMenuContent` are the exception — they set
their own opaque surface (`bg-card` / `bg-popover`) and read fine on any
background. Everything else assumes the dark canvas above.

### Styling idiom: Tailwind utility classes, but the stylesheet is a fixed snapshot

Components are styled with Tailwind utility classes reading CSS custom
properties — not inline styles, not a CSS-in-JS runtime. **Important:** the
shipped `styles.css` is a one-time compiled snapshot (Tailwind only emits
CSS for classes it saw used at build time) — there is no live Tailwind
compiler here. A brand-new utility class you invent for your own layout glue
(e.g. some `gap-8` or `bg-accent` never used by these 9 components) may
simply have **no CSS rule behind it** and render unstyled.

Classes confirmed present and safe to reuse directly:

| Purpose | Classes |
|---|---|
| Surfaces | `bg-background`, `bg-card`, `bg-popover`, `bg-secondary`, `bg-muted`, `bg-destructive` |
| Text on those surfaces | `text-foreground`, `text-card-foreground`, `text-popover-foreground`, `text-secondary-foreground`, `text-muted-foreground`, `text-destructive` |
| Brand accent | `bg-primary`, `text-primary`, `text-primary-foreground` (yellow — the one accent color) |
| Borders | `border`, `border-t`, `border-b`, `border-input`, `border-transparent`, `bg-border` |
| Radius | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` |
| Display font | `font-display` (Archivo — used for headings/titles, e.g. `CardTitle`) |

For anything **not** in that table (a new wrapper div, a one-off layout
tweak), reach for the raw CSS custom properties instead of guessing a new
utility class — they're always defined at `:root` regardless of which
Tailwind classes got compiled: `var(--background)`, `var(--foreground)`,
`var(--card)`, `var(--popover)`, `var(--primary)`, `var(--primary-foreground)`,
`var(--secondary)`, `var(--muted)`, `var(--muted-foreground)`,
`var(--accent)`, `var(--accent-foreground)`, `var(--destructive)`,
`var(--border)`, `var(--input)`, `var(--ring)`, `var(--radius)`. Body text
uses `font-sans` (Space Grotesk) by default — that's already wired through
`body`, nothing to add. `--font-mono` (JetBrains Mono) is defined but not
used by any shipped component; reach for it via `style={{fontFamily:
'var(--font-mono)'}}` if you need it.

### Where the truth lives

- `styles.css` / `_ds_bundle.css` — the actual compiled CSS, tokens included
  (there's no separate `tokens/` folder; the custom properties are baked
  directly into `_ds_bundle.css`). Read this before styling anything.
- Each component's `.prompt.md` — usage reference and the props surface.

### Example

```jsx
import { Button, Card, CardContent, CardHeader, CardTitle } from 'makop-frontend'

function RosterCard() {
  return (
    <div className="bg-background p-6 text-foreground">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Player roster</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Add player</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```
