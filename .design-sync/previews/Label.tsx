import { Input, Label } from "makop-frontend"

// bg-background/text-foreground: see Button.tsx's Variants comment.
export function WithInput() {
  return (
    <div className="flex w-72 flex-col gap-1.5 bg-background p-6 text-foreground">
      <Label htmlFor="preview-name">Name</Label>
      <Input id="preview-name" placeholder="Name" />
    </div>
  )
}

export function Standalone() {
  return (
    <div className="bg-background p-6 text-foreground">
      <Label>Position</Label>
    </div>
  )
}
