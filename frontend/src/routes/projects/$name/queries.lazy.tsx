import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/queries')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/queries"!</div>
}
