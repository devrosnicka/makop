import { Separator } from "makop-frontend"

// bg-background/text-foreground: see Button.tsx's Variants comment.
export function Horizontal() {
  return (
    <div className="flex w-72 flex-col gap-4 bg-background p-6 text-foreground">
      <div className="text-sm">Player roster</div>
      <Separator />
      <div className="text-sm text-muted-foreground">Team members and their contact details.</div>
    </div>
  )
}

export function Vertical() {
  return (
    <div className="flex h-10 items-center gap-4 bg-background p-6 text-sm text-foreground">
      <span>Roster</span>
      <Separator orientation="vertical" />
      <span>Health</span>
      <Separator orientation="vertical" />
      <span>Settings</span>
    </div>
  )
}
