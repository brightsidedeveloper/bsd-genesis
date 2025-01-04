import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/server')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/server"!</div>
}
