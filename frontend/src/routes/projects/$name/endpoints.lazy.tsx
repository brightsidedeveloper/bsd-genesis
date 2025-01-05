import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

export const Route = createLazyFileRoute('/projects/$name/endpoints')({
  component: RouteComponent,
})

function RouteComponent() {
  const [endpoint, setEndpoint] = useState('')

  const data = useMemo(() => some[endpoint] ?? false, [endpoint])

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Endpoints</h2>
      <hr />
      <div className="flex relative">
        <ScrollArea className="flex-1 h-[calc(100vh-var(--header-height)-40px-64px)]">
          {endpoint ? (
            <div className="flex flex-col gap-4 p-4">
              {endpoint}: {JSON.stringify(data)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h3 className="text-lg font-semibold">Select or create an endpoint</h3>
            </div>
          )}
        </ScrollArea>
        <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l pl-4 pb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Paths</h3>
            <button className="font-light hover:text-blue-500">+ New</button>
          </div>
          <Input className="mb-2" placeholder="Search" />
          <div className="flex flex-col gap-2">
            {endpoints.map((e) => (
              <button
                key={e}
                onClick={() => setEndpoint((c) => (c === e ? '' : e))}
                className={cn(e === endpoint && 'bg-primary/15', 'hover:bg-primary/10 rounded-lg p-2')}
              >
                {e}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

const endpoints = ['/api/v1/users'] as const

const some: SomeType = {
  '/api/v1/users': {
    methods: ['GET', 'POST'],
    secured: ['POST'],
  },
}

type SomeType = Record<
  string,
  {
    methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[]
    secured: ('GET' | 'POST' | 'PUT' | 'DELETE')[]
  }
>
