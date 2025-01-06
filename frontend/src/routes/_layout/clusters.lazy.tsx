import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/clusters')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Clusters</div>
}
