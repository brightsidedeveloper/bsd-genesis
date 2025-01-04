import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/tables')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/tables"!</div>
}
