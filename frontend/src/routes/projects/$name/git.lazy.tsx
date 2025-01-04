import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/git')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/git"!</div>
}
