import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "makop-frontend"

const players = [
  { name: "Jonáš Novák", number: 9, position: "Forward", email: "jonas@example.com" },
  { name: "Tomáš Dvořák", number: 4, position: "Defender", email: "tomas@example.com" },
  { name: "Petr Svoboda", number: 1, position: "Goalkeeper", email: "petr@example.com" },
]

// bg-background/text-foreground: see Button.tsx's Variants comment.
export function RosterTable() {
  return (
    <div className="w-full max-w-2xl bg-background p-6 text-foreground">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>#</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.email}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.number}</TableCell>
              <TableCell>{player.position}</TableCell>
              <TableCell>{player.email}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function Empty() {
  return (
    <div className="w-full max-w-2xl bg-background p-6 text-foreground">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>#</TableHead>
            <TableHead>Position</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground">
              No players yet.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
