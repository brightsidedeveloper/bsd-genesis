import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$dir"!</div>
}
