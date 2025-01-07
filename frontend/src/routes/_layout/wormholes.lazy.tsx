import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/wormholes')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Inter galactic & solar gRPC communication layers.</div>
}
