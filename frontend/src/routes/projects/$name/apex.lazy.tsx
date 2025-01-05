import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useApexStore } from '@/hooks/useApexStore'
import { cn } from '@/lib/utils'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

export const Route = createLazyFileRoute('/projects/$name/apex')({
  component: RouteComponent,
})

function RouteComponent() {
  const { apex, isDirty } = useApexStore()

  const [operation, setOperation] = useState('')

  const data = useMemo(() => some[operation] ?? false, [operation])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">APEX</h2>
        <Button size="sm">Generate</Button>
      </div>
      <hr />
      <div className="flex relative">
        <ScrollArea className="flex-1 h-[calc(100vh-var(--header-height)-40px-64px)]">
          {operation ? (
            <div className="flex flex-col gap-4 p-4">
              {operation}: {JSON.stringify(data)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h3 className="text-lg font-semibold">Select or create an operation</h3>
            </div>
          )}
          <pre>{JSON.stringify(apex)}</pre>
          {isDirty ? <div>Dirty</div> : <div>Clean</div>}
        </ScrollArea>
        <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l px-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Operations</h3>
            <button className="font-light hover:text-blue-500">+ New</button>
          </div>
          <Input className="mb-2" placeholder="Search" />
          <div className="flex flex-col gap-2">
            {operations.map((e) => (
              <button
                key={e}
                onClick={() => setOperation((c) => (c === e ? '' : e))}
                className={cn(e === operation && 'bg-primary/15', 'hover:bg-primary/10 rounded-lg p-2')}
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

const operations = ['getUser'] as const

const some: SomeType = {
  getUser: {
    method: 'GET',
    endpoint: '/api/v1/users',
    desc: 'Get all the users in the database',
  },
}

type SomeType = Record<
  string,
  {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    endpoint: string
    desc: string
  }
>
