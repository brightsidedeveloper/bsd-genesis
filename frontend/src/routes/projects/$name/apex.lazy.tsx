import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/apex')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/apex"!</div>
}