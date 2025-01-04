import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRouteWithContext<QueryContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}

type QueryContext = {
  queryClient: QueryClient
}
