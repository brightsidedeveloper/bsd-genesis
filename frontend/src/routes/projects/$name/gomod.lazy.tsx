import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/gomod')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/gomod"!</div>
}
