import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/modules')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>TODO</div>
}
