import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/github-actions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/github-actions"!</div>
}
