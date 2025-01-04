import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/deploy')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/deploy"!</div>
}
