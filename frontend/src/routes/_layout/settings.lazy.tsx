import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>There is nothing to configure yet...</div>
}
