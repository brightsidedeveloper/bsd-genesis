import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { routeTree } from './routeTree.gen'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const qc = new QueryClient()

const r = createRouter({ routeTree, context: { queryClient: qc } })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof r
  }
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={r} />
    </QueryClientProvider>
  </React.StrictMode>
)
