import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/universe')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Super Clusters!</div>
}
