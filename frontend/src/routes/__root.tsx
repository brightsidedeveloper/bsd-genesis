import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<QueryContext>()({
  component: RootComponent,
})

function RootComponent() {
  return <Outlet />
}

type QueryContext = {
  queryClient: QueryClient
}
