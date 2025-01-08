import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Go from '@/Go'
import useGo from '@/hooks/useGo'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const [solarSystemDir, refetch] = useGo('', () => Go.app.env.get('GENESIS_PATH'))

  const change = () => {
    Go.projects.changeDir().then(refetch)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Genesis Directory</Label>
      <div>
        <Card>
          <CardHeader>
            <span className="flex items-center justify-between">
              <span>{solarSystemDir}</span>
              <Button onClick={change}>Change</Button>
            </span>
          </CardHeader>
        </Card>
      </div>{' '}
    </div>
  )
}
