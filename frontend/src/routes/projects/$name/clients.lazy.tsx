import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { GetClientAppsType } from '@/types/schemas'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createLazyFileRoute('/projects/$name/clients')({
  component: RouteComponent,
})

function RouteComponent() {
  const [apps, setApps] = useState<GetClientAppsType | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Clients</h2>
      <hr />
      <h3 className="text-lg font-semibold">Apps</h3>
      <div className="grid grid-cols-3 gap-4">
        {apps?.map((app, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="capitalize">{app.type}</CardTitle>
              <CardDescription>{app.exists ? 'Open Project' : 'Create Project'}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="ml-auto">{app.exists ? 'code .' : 'Create'}</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
