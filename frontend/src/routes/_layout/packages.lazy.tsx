import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/packages')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>TODO</div>
}
