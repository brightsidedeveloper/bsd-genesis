import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/starships')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Go / Node</div>
}
