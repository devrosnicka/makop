import { Plus, Trash2 } from "lucide-react"
import { Button } from "makop-frontend"

// Wrapped in bg-background/text-foreground: makop is dark-first with no
// light theme, so the app's real ambient page is always this dark surface.
// The design-tool's gallery card canvas defaults to plain white, which
// swallows anything relying on inherited (rather than explicit) text color —
// most visibly the `ghost` variant, invisible without this wrapper.
export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-background p-6 text-foreground">
      <Button variant="default">Save changes</Button>
      <Button variant="destructive">Delete player</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="secondary">View roster</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="link">Learn more</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-background p-6 text-foreground">
      <Button size="xs">Add player</Button>
      <Button size="sm">Add player</Button>
      <Button size="default">Add player</Button>
      <Button size="lg">Add player</Button>
      <Button size="icon" aria-label="Add player">
        <Plus />
      </Button>
    </div>
  )
}

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-background p-6 text-foreground">
      <Button>
        <Plus />
        Add player
      </Button>
      <Button variant="destructive">
        <Trash2 />
        Delete
      </Button>
      <Button disabled>Saving…</Button>
    </div>
  )
}
