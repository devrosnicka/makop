import { Tabs, TabsContent, TabsList, TabsTrigger } from "makop-frontend"

// bg-background/text-foreground: see Button.tsx's Variants comment.
export function Default() {
  return (
    <Tabs defaultValue="roster" className="w-96 bg-background p-6 text-foreground">
      <TabsList>
        <TabsTrigger value="roster">Roster</TabsTrigger>
        <TabsTrigger value="health">Health</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="roster" className="text-sm text-muted-foreground">
        Team members and their contact details.
      </TabsContent>
    </Tabs>
  )
}

export function LineVariant() {
  return (
    <Tabs defaultValue="upcoming" className="w-96 bg-background p-6 text-foreground">
      <TabsList variant="line">
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming" className="text-sm text-muted-foreground">
        Saturday vs. Kladno Rangers, 15:00.
      </TabsContent>
    </Tabs>
  )
}
