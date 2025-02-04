import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/auth"!</div>
}
