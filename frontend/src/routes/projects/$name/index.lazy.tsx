import useDirAndName from '@/hooks/useDirAndName'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { name } = useDirAndName()
  return (
    <div>
      Hello {name}
      <br />
      Genesis AI
      <br />
      <br />
      Todo: Put Kanban Here
    </div>
  )
}
