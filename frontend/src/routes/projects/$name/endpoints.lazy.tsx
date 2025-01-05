import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EndpointType, useApexStore } from '@/hooks/useApexStore'
import useDirAndName from '@/hooks/useDirAndName'
import { cn } from '@/lib/utils'
import { createLazyFileRoute } from '@tanstack/react-router'
import isEqual from 'lodash.isequal'
import { Trash } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/projects/$name/endpoints')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const { apex, originalApex, reset, saveApex } = useApexStore()
  const [endpoint, setEndpoint] = useState('')

  const data = useMemo(() => apex.endpoints.find(({ path }) => path === endpoint) ?? false, [apex.endpoints, endpoint])

  const isDirty = useMemo(() => !isEqual(apex, originalApex), [apex, originalApex])

  const [search, setSearch] = useState('')

  const filteredEndpoints = useMemo(() => {
    return apex.endpoints.filter(({ path }) => search === '' || path.includes(search))
  }, [apex.endpoints, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Endpoints</h2>
        {isDirty && (
          <div className="flex gap-4">
            <Button size="sm" variant="secondary" onClick={reset}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => saveApex(dir)}>
              Write File
            </Button>
          </div>
        )}
      </div>
      <hr />
      <div className="flex relative">
        <ScrollArea className="flex-1 h-[calc(100vh-var(--header-height)-40px-64px)]">
          {data ? (
            <UpdateEndpoint endpoint={data} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-96">
              <h3 className="text-lg font-semibold">Select or create an endpoint</h3>
            </div>
          )}
        </ScrollArea>
        <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l pl-4 pb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Paths</h3>
            <Dialog>
              <DialogTrigger>
                <Button size="sm">+ New</Button>
              </DialogTrigger>
              <CreateEndpointDialog />
            </Dialog>
          </div>
          <Input className="mb-2" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-col gap-2">
            {filteredEndpoints.map(({ path }) => (
              <button
                key={path}
                onClick={() => setEndpoint((c) => (c === path ? '' : path))}
                className={cn(path === endpoint && 'bg-primary/15', 'hover:bg-primary/10 rounded-lg p-2')}
              >
                {path}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function CreateEndpointDialog() {
  const { addEndpoint, apex } = useApexStore()
  const [namespace, setNamespace] = useState('')
  const [path, setPath] = useState('')

  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <DialogContent>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          const trimmedNamespace = namespace.trim()
          const trimmedPath = path.trim()
          if (!trimmedNamespace) return toast.error('Namespace is required')
          if (!trimmedPath) return toast.error('Path is required')
          if (trimmedNamespace.includes(' ') || trimmedNamespace.includes('/'))
            return toast.error('Namespace cannot contain spaces or slashes')
          if (trimmedPath.includes(' ') || trimmedPath.endsWith('/')) return toast.error('Path cannot contain spaces or end in slashes')
          const newPath = '/api/' + trimmedNamespace + '/' + trimmedPath
          if (apex.endpoints.some((e) => e.path === newPath)) return toast.error('Endpoint already exists')
          addEndpoint({
            methods: [],
            path: newPath,
            secured: [],
          })
          setNamespace('')
          setPath('')
          closeRef.current?.click()
        }}
      >
        <DialogHeader>
          <DialogTitle>
            /api/{namespace || '_ '}/{path || '_'}
          </DialogTitle>
          <DialogDescription>Create a new endpoint!</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Namespace</Label>
            <Input placeholder="v1" value={namespace} onChange={(e) => setNamespace(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Path</Label>
            <Input placeholder="users" value={path} onChange={(e) => setPath(e.target.value)} />
          </div>
        </div>
        <DialogClose ref={closeRef} />
        <DialogFooter>
          <Button>Create</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function UpdateEndpoint({ endpoint }: { endpoint: EndpointType }) {
  const { updateEndpoint, deleteEndpoint } = useApexStore()

  const path = useMemo(() => endpoint.path, [endpoint.path])

  const [methods, setMethods] = useState(endpoint.methods)
  const [secured, setSecured] = useState(endpoint.secured)

  useEffect(() => {
    setMethods(endpoint.methods)
    setSecured(endpoint.secured)
  }, [endpoint.methods, endpoint.secured])

  const closeRef = useRef<HTMLButtonElement>(null)

  const reset = useCallback(() => {
    setMethods(endpoint.methods)
    setSecured(endpoint.secured)
  }, [endpoint.methods, endpoint.secured])

  const isDirty = useMemo(
    () => !isEqual(endpoint.methods, methods) || !isEqual(endpoint.secured, secured),
    [endpoint.methods, endpoint.secured, methods, secured]
  )

  return (
    <div className="flex flex-col gap-4 pr-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{path}</h3>
        <Dialog>
          <DialogTrigger>
            <Trash className="size-5 text-destructive" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Endpoint</DialogTitle>
              <DialogDescription>Are you sure you want to delete this endpoint?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div className="flex items-center gap-4 justify-between">
                <DialogClose asChild>
                  <Button ref={closeRef} variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteEndpoint(path)
                    closeRef.current?.click()
                  }}
                >
                  Delete
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <hr />
      <div className="grid grid-cols-2 gap-6">
        {METHODS.map((m) => (
          <div key={m} className="flex flex-col gap-2">
            <Label className="text-lg">{m}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Label htmlFor={'enabled-' + m}>Enabled</Label>
              <Checkbox
                id={'enabled-' + m}
                checked={methods.includes(m)}
                onCheckedChange={(checked) => setMethods((c) => (checked ? [...c, m] : c.filter((i) => i !== m)))}
              />

              <Label htmlFor={'secured-' + m}>Secured</Label>
              <Checkbox
                disabled={!methods.includes(m)}
                checked={secured.includes(m)}
                onCheckedChange={(checked) => setSecured((c) => (checked ? [...c, m] : c.filter((i) => i !== m)))}
                id={'secured-' + m}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 justify-end">
        <Button disabled={!isDirty} variant="secondary" onClick={reset}>
          Cancel
        </Button>
        <Button disabled={!isDirty} onClick={() => updateEndpoint(path, { path, methods, secured })}>
          Save
        </Button>
      </div>
    </div>
  )
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
