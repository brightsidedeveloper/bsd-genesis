import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/sentry')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$name/sentry"!</div>
}
