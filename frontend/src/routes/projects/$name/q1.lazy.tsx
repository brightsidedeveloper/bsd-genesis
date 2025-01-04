import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/q1')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/q1"!</div>
}
