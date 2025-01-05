import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Go from '@/Go'
import useDirAndName from '@/hooks/useDirAndName'
import { GetClientAppsSchema, GetClientAppsType } from '@/types/schemas'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/projects/$name/clients')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const [apps, setApps] = useState<GetClientAppsType | null>(null)
  const refetchClients = useCallback(() => {
    Go.clients.get(dir).then((a) => setApps(GetClientAppsSchema.parse(a)))
  }, [dir])
  useEffect(refetchClients, [refetchClients])

  const [creating, setCreating] = useState(false)

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
              <Button
                disabled={creating}
                className="ml-auto"
                onClick={() => {
                  if (app.exists) {
                    Go.clients.open(dir, app.type)
                    return
                  }
                  setCreating(true)
                  Go.clients
                    .create(dir, app.type)
                    .then(() => {
                      refetchClients()
                    })
                    .catch(() => {
                      toast('Failed to create project', { description: 'That stinks, my bad' })
                    })
                    .finally(() => {
                      setCreating(false)
                    })
                }}
              >
                {app.exists ? 'code .' : 'Create'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
