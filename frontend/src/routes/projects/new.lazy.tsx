import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/new"!</div>
}
