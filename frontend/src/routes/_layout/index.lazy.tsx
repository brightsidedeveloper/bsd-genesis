import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GetProjects } from '../../../wailsjs/go/main/App'
import { Button } from '@/components/ui/button'

export const Route = createLazyFileRoute('/_layout/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [projects, setProjects] = useState<ProjectData[] | null>(null)

  useEffect(() => {
    GetProjects().then((p) => setProjects((p as ProjectData[]) ?? []))
  }, [])

  if (!projects) return null

  return (
    <div className="grid grid-cols-3 gap-4">
      {projects.map(({ dir, project: { name, description } }) => (
        <Link key={dir} to="/projects/$dir" params={{ dir }}>
          <Card>
            <CardHeader>
              <CardTitle>{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="ml-auto">Open</Button>
            </CardFooter>
          </Card>
        </Link>
      ))}
      <Link to="/projects/new" className="group">
        <Card className="size-full flex items-center justify-center border-dashed min-h-32">
          <Plus className="group-hover:opacity-100 opacity-70" />
        </Card>
      </Link>
    </div>
  )
}

type ProjectData = {
  dir: string
  project: Project
}

type Project = {
  name: string
  description?: string
}
