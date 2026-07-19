import { Input } from "makop-frontend"

// bg-background/text-foreground: see Button.tsx's Variants comment — makop
// has no light theme, so previews are wrapped in the app's real dark canvas.
export function Basic() {
  return (
    <div className="w-72 bg-background p-6 text-foreground">
      <Input placeholder="Jersey #" />
    </div>
  )
}

export function WithValue() {
  return (
    <div className="w-72 bg-background p-6 text-foreground">
      <Input defaultValue="Jonáš Novák" />
    </div>
  )
}

export function Invalid() {
  return (
    <div className="w-72 bg-background p-6 text-foreground">
      <Input defaultValue="not-an-email" aria-invalid />
    </div>
  )
}

export function Disabled() {
  return (
    <div className="w-72 bg-background p-6 text-foreground">
      <Input placeholder="Notes" disabled />
    </div>
  )
}
