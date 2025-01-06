import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import useDirAndName from '@/hooks/useDirAndName'
import { SchemaSchema, SchemaType, useApexStore } from '@/hooks/useApexStore'
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Delete, Trash } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

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

  const [tab, setTab] = useState<'All' | 'Query' | 'Body' | 'Response' | 'Custom'>('All')

  const filteredSchemas = useMemo(() => {
    return apex.schemas
      .filter(({ name, type }) => (tab === 'All' || type === tab) && (search === '' || name.toLowerCase().includes(search.toLowerCase())))
      .sort((a, b) => {
        // Sort by type priority first
        const typeOrderA = schemaTypeOrder[a.type] || 99 // Default large number if missing
        const typeOrderB = schemaTypeOrder[b.type] || 99

        if (typeOrderA !== typeOrderB) {
          return typeOrderA - typeOrderB
        }

        // If types are the same, sort alphabetically by name
        return a.name.localeCompare(b.name)
      })
  }, [apex.schemas, search, tab])

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
              <h3 className="text-lg font-semibold">Select or create a schema</h3>
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
            <Select value={tab} onValueChange={(t: SchemaTypeUnion | 'All') => setTab(t)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Query">Query</SelectItem>
                  <SelectItem value="Body">Body</SelectItem>
                  <SelectItem value="Response">Response</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {filteredSchemas.map(({ name }) => {
              return (
                <button
                  key={name}
                  onClick={() => setSchema((c) => (c === name ? '' : name))}
                  className={cn(name === schema && 'bg-primary/15', 'hover:bg-primary/10 rounded-lg p-2')}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

const schemaTypeOrder: Record<string, number> = {
  Query: 1,
  Body: 2,
  Response: 3,
  Custom: 4,
}

function CreateSchemaDialog() {
  const { addSchema, apex } = useApexStore()
  const [type, setType] = useState<SchemaTypeUnion | ''>('')
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
          addSchema({ name: finalName, type, fields: {}, required: [] })
          setName('')
          setType('')
          closeRef.current?.click()
        }}
      >
        <DialogHeader>
          <DialogTitle>{!type && !name ? 'Create Schema' : name + (type === 'Custom' ? '' : type)}</DialogTitle>
          <DialogDescription>Create a new schema!</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="User" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(t: SchemaTypeUnion) => setType(t)}>
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

export type SchemaTypeUnion = 'Query' | 'Body' | 'Response' | 'Custom'

function UpdateSchema({ schema }: { schema: SchemaType }) {
  const { apex, deleteSchema, updateSchema } = useApexStore()

  const formatedFields = useMemo(
    () =>
      Object.entries(schema.fields).map(([key, value]) => {
        return {
          id: crypto.randomUUID(),
          key,
          value,
        }
      }),
    [schema.fields]
  )

  const [required, setRequired] = useState(schema.required)
  useEffect(() => {
    setRequired(schema.required)
  }, [schema.required])
  const [fields, setFields] = useState(formatedFields)
  useEffect(() => {
    setFields(formatedFields)
  }, [formatedFields])

  console.log(fields, formatedFields)
  const isDirty = useMemo(
    () => !isEqual(fields, formatedFields) || !isEqual(required, schema.required),
    [fields, formatedFields, required, schema.required]
  )

  const name = useMemo(() => schema.name, [schema.name])

  const addField = useCallback(() => {
    setFields((c) => {
      let i = 0
      while (`new${i}` in c) {
        i++
      }
      return [
        ...c,
        {
          id: crypto.randomUUID(),
          key: `new${i}`,
          value: 'string',
        },
      ]
    })
  }, [])

  const saveSchema = useCallback(() => {
    const keys = fields.map(({ key }) => key)
    const uniqueKeys = new Set(keys)
    if (keys.length !== uniqueKeys.size) {
      return toast.error('Keys must be unique')
    }
    updateSchema(
      name,
      SchemaSchema.parse({
        name,
        type: schema.type,
        fields: Object.fromEntries(fields.map(({ key, value }) => [key, value])),
        required,
      })
    )
  }, [fields, name, required, schema.type, updateSchema])

  const reset = useCallback(() => {
    setFields(formatedFields)
    setRequired(schema.required)
  }, [formatedFields, schema.required])

  const closeRef = useRef<HTMLButtonElement>(null)
  return (
    <div className="flex flex-col gap-4 pr-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{name}</h3>
        <Dialog>
          <DialogTrigger>
            <Trash className="size-5 text-destructive" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {schema.name}?</DialogTitle>
              <DialogDescription>Are you sure you want to delete {schema.name}?</DialogDescription>
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
                    deleteSchema(name)
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
      <div className="flex flex-col gap-4">
        {fields.length > 0 ? (
          fields.map(({ id, key, value }) => {
            let insert = null
            const isArray = typeof value === 'object'
            if (isArray) {
              insert = (
                <>
                  <Select
                    value={value.arrayType}
                    onValueChange={(v) => {
                      setFields((c) => {
                        const index = c.findIndex((f) => f.id === id)
                        if (index === -1) return c
                        return c.map((f, i) => {
                          if (i === index) {
                            return {
                              ...f,
                              value: {
                                type: 'array',
                                arrayType: v,
                              },
                            }
                          }
                          return f
                        })
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Basic Types</SelectLabel>
                        <SelectItem value="string">string[]</SelectItem>
                        <SelectItem value="number">number[]</SelectItem>
                        <SelectItem value="boolean">boolean[]</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Custom</SelectLabel>
                        {apex.schemas
                          .filter(({ type }) => type === 'Custom')
                          .map(({ name }) => {
                            return (
                              <SelectItem key={name} value={name}>
                                {name}[]
                              </SelectItem>
                            )
                          })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </>
              )
            }

            return (
              <div key={id} className={cn('grid grid-cols-4 items-center gap-2', isArray && 'grid-cols-5')}>
                <div className="flex items-center gap-1">
                  <Label>Required</Label>
                  <Checkbox
                    checked={required.includes(key)}
                    onCheckedChange={(checked) => {
                      setRequired((c) => (checked ? Array.from(new Set([...c, key])) : c.filter((i) => i !== key)))
                    }}
                  />
                </div>
                <Input
                  id={id}
                  value={key}
                  onChange={(e) =>
                    setFields((c) => {
                      const index = c.findIndex((f) => f.id === id)
                      if (index === -1) return c
                      return c.map((f, i) => {
                        if (i === index) {
                          return {
                            ...f,
                            key: e.target.value,
                          }
                        }
                        return f
                      })
                    })
                  }
                />
                <Select
                  value={typeof value === 'object' ? value.type : value}
                  onValueChange={(v) => {
                    setFields((c) => {
                      const index = c.findIndex((f) => f.id === id)
                      if (index === -1) return c
                      return c.map((f, i) => {
                        if (i === index) {
                          if (v === 'array') {
                            return {
                              ...f,
                              value: {
                                type: v,
                                arrayType: typeof f.value === 'object' ? f.value.arrayType : 'string',
                              },
                            }
                          }
                          return {
                            ...f,
                            value: v,
                          }
                        }
                        return f
                      })
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Basic Types</SelectLabel>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                      {schema.type !== 'Query' && <SelectItem value="array">Array</SelectItem>}
                    </SelectGroup>
                    {schema.type !== 'Query' && (
                      <SelectGroup>
                        <SelectLabel>Custom</SelectLabel>
                        {apex.schemas
                          .filter(({ type }) => type === 'Custom')
                          .map(({ name }) => {
                            return (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            )
                          })}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
                {insert}

                <button
                  className="ml-auto"
                  onClick={() => {
                    setRequired((c) => c.filter((i) => i !== key))
                    setFields((c) => c.filter((f) => f.id !== id))
                  }}
                >
                  <Delete className="size-4 text-destructive" />
                </button>
              </div>
            )
          })
        ) : (
          <div className="h-20 flex flex-col gap-2 items-center justify-center">
            <h3 className="text-lg font-semibold">No fields</h3>
            <p className="text-sm text-muted-foreground">Add fields to this schema</p>
          </div>
        )}
        <Button size="sm" onClick={addField}>
          + Add Field
        </Button>
      </div>
      <div className="flex gap-4 justify-end">
        <Button disabled={!isDirty} variant="secondary" onClick={reset}>
          Cancel
        </Button>
        <Button disabled={!isDirty} onClick={() => saveSchema()}>
          Save
        </Button>
      </div>
    </div>
  )
}
