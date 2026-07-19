import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "makop-frontend"

export function RosterCard() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Player roster</CardTitle>
        <CardDescription>Team members and their contact details.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">12 players · 2 pending invites</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Add player</Button>
      </CardFooter>
    </Card>
  )
}

export function StatCard() {
  return (
    <Card className="w-72">
      <CardHeader>
        <CardTitle className="font-display text-lg">Backend status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <p>
          <span className="text-muted-foreground">DB:</span> ok
        </p>
        <p>
          <span className="text-muted-foreground">Server time:</span> 19:32:07
        </p>
      </CardContent>
    </Card>
  )
}

export function WithAction() {
  return (
    <Card className="w-96">
      <CardHeader className="border-b pb-6">
        <CardTitle>Match day squad</CardTitle>
        <CardDescription>Saturday vs. Kladno Rangers, 15:00.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">18 of 22 players confirmed.</p>
      </CardContent>
    </Card>
  )
}
