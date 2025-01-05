import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import useDirAndName from '@/hooks/useDirAndName'
import { SchemaType, useApexStore } from '@/hooks/useApexStore'
import isEqual from 'lodash.isequal'
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const Route = createLazyFileRoute('/projects/$name/schemas')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const { apex, originalApex, reset, saveApex } = useApexStore()
  const [schema, setSchema] = useState('')

  const data = useMemo(() => apex.schemas.find(({ name }) => name === schema) ?? false, [apex.schemas, schema])

  const isDirty = useMemo(() => !isEqual(apex, originalApex), [apex, originalApex])

  const [search, setSearch] = useState('')

  const filteredSchemas = useMemo(() => {
    return apex.schemas.filter(({ name }) => search === '' || name.toLowerCase().includes(search.toLowerCase()))
  }, [apex.schemas, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Schemas</h2>
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
            <UpdateSchema schema={data} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-96">
              <h3 className="text-lg font-semibold">Select or create an schema</h3>
            </div>
          )}
        </ScrollArea>
        <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l pl-4 pb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Schemas</h3>
            <Dialog>
              <DialogTrigger>
                <Button size="sm">+ New</Button>
              </DialogTrigger>
              <CreateSchemaDialog />
            </Dialog>
          </div>
          <Input className="mb-2" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-col gap-2">
            {filteredSchemas.map(({ name }) => (
              <button
                key={name}
                onClick={() => setSchema((c) => (c === name ? '' : name))}
                className={cn(name === schema && 'bg-primary/15', 'hover:bg-primary/10 rounded-lg p-2')}
              >
                {name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function CreateSchemaDialog() {
  const { addSchema, apex } = useApexStore()
  const [type, setType] = useState<SchemaTypeTypes | ''>('')
  const [name, setName] = useState('')

  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <DialogContent>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          const cleanName = name.replace(/[^\w]/g, '')
          const finalName = type === 'Custom' ? cleanName : cleanName + type
          if (!finalName) return toast.error('Name is required')
          if (finalName.includes(' ')) return toast.error('Name cannot contain spaces')
          if (!type) return toast.error('Type is required')
          if (apex.schemas.some((s) => s.name === finalName)) return toast.error('Schema already exists')
          addSchema({ name: finalName, type, fields: {} })
          setName('')
          setType('')
          closeRef.current?.click()
        }}
      >
        <DialogHeader>
          <DialogTitle>{!type && !name ? 'Create Schema' : name + (type === 'Custom' ? '' : type)}</DialogTitle>
          <DialogDescription>Create a new endpoint!</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="User" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(t: SchemaTypeTypes) => setType(t)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Query">Query</SelectItem>
                  <SelectItem value="Body">Body</SelectItem>
                  <SelectItem value="Response">Response</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
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

export type SchemaTypeTypes = 'Query' | 'Body' | 'Response' | 'Custom'

function UpdateSchema({ schema }: { schema: SchemaType }) {
  return JSON.stringify(schema, null, 2)
}
