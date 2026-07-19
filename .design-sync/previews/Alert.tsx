import { Alert, AlertDescription, AlertTitle } from "makop-frontend"

export function Info() {
  return (
    <Alert className="w-96">
      <AlertTitle>Autosave on</AlertTitle>
      <AlertDescription>Roster changes save automatically — no need to hit submit twice.</AlertDescription>
    </Alert>
  )
}

export function Destructive() {
  return (
    <Alert variant="destructive" className="w-96">
      <AlertTitle>Sign-in blocked</AlertTitle>
      <AlertDescription>That Google account is not authorized for makop.</AlertDescription>
    </Alert>
  )
}

export function DescriptionOnly() {
  return (
    <Alert variant="destructive" className="w-96">
      <AlertDescription>Name is required.</AlertDescription>
    </Alert>
  )
}
