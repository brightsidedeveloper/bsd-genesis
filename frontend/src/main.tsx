import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { routeTree } from './routeTree.gen'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/theme-provider'

const qc = new QueryClient()

const r = createRouter({ routeTree, context: { queryClient: qc } })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof r
  }
}

const div = document.getElementById('root')
const root = createRoot(div!)
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={qc}>
        <RouterProvider router={r} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
)
