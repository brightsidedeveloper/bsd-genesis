import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/tspack')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/gpack"!</div>
}
