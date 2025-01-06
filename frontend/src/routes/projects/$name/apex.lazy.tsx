import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Go from '@/Go'
import { EndpointSchema, MethodEnumType, OperationSchema, SchemaType, useApexStore } from '@/hooks/useApexStore'
import useDirAndName from '@/hooks/useDirAndName'
import { cn } from '@/lib/utils'
import { createLazyFileRoute } from '@tanstack/react-router'
import isEqual from 'lodash.isequal'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/projects/$name/apex')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const { apex, originalApex, saveApex, reset } = useApexStore()

  const isDirty = useMemo(() => !isEqual(apex, originalApex), [apex, originalApex])

  const [operation, setOperation] = useState('')

  const [search, setSearch] = useState('')

  const filteredOperations = useMemo(
    () => apex.operations.filter(({ name }) => search === '' || name.toLowerCase().includes(search.toLowerCase())),
    [apex.operations, search]
  )

  const [generating, setGenerating] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">APEX</h2>
        {isDirty ? (
          <div className="flex gap-4">
            <Button size="sm" variant="secondary" onClick={reset}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => saveApex(dir)}>
              Write File
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            disabled={generating}
            onClick={() => {
              setGenerating(true)
              Go.apex
                .generate(dir)
                .then(() => {
                  toast.success('Code generated.')
                })
                .catch(() => {
                  toast.error('Failed to generate code.')
                })
                .finally(() => {
                  setGenerating(false)
                })
            }}
          >
            Generate
          </Button>
        )}
      </div>
      <hr />
      <div className="flex relative">
        <ScrollArea className="flex-1 h-[calc(100vh-var(--header-height)-40px-64px)]">
          {operation ? (
            <ViewOperation operationName={operation} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-96">
              <h3 className="text-lg font-semibold">Select or create an operation</h3>
            </div>
          )}
        </ScrollArea>
        <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l px-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Operations</h3>
            <Dialog>
              <DialogTrigger>
                <Button size="sm">+ New</Button>
              </DialogTrigger>
              <CreateOperationDialog />
            </Dialog>
          </div>
          <Input className="mb-2" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-col gap-2">
            {filteredOperations.map(({ name }) => (
              <button
                key={name}
                onClick={() => setOperation((o) => (o === name ? '' : name))}
                className={cn(name === operation && 'bg-primary/15', 'hover:bg-primary/10 rounded-lg p-2')}
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

function ViewOperation({ operationName }: { operationName: string }) {
  const { apex, updateOperation } = useApexStore()

  const { endpoint, method, name, responseSchema, bodySchema, querySchema } = useMemo(
    () => OperationSchema.parse(apex.operations.find((o) => o.name === operationName)),
    [apex.operations, operationName]
  )

  const { secured } = useMemo(() => EndpointSchema.parse(apex.endpoints.find((e) => e.path === endpoint)), [apex.endpoints, endpoint])
  const isSecure = secured.includes(method)

  const [open, setOpen] = useState(false)
  const [request, setRequest] = useState(bodySchema ?? querySchema ?? '')
  useEffect(() => {
    setRequest(bodySchema ?? querySchema ?? '')
  }, [bodySchema, querySchema])

  const requestOptions = useMemo(
    () =>
      apex.schemas
        .filter((s) => {
          if (method === 'GET') return s.type === 'Query'
          else return s.type === 'Body'
        })
        .map(({ name }) => name),
    [apex.schemas, method]
  )

  const [open2, setOpen2] = useState(false)
  const [response, setResponse] = useState(responseSchema)
  useEffect(() => {
    setResponse(responseSchema)
  }, [responseSchema])

  const responseSchemaOptions = useMemo(() => apex.schemas.map(({ name }) => name).filter((s) => s.endsWith('Response')), [apex.schemas])

  const isDirty = useMemo(
    () => response !== responseSchema || (querySchema ?? bodySchema ?? '') !== request,
    [bodySchema, querySchema, request, response, responseSchema]
  )

  const reset = useCallback(() => {
    setRequest(bodySchema ?? querySchema ?? '')
    setResponse(responseSchema)
  }, [bodySchema, querySchema, responseSchema])

  const saveOperation = useCallback(() => {
    if (!response) return toast.error('Please select a response schema.')
    if (request) {
      if (method === 'GET') updateOperation(operationName, { name, method, endpoint, querySchema: request, responseSchema: response })
      else updateOperation(operationName, { name, method, endpoint, bodySchema: request, responseSchema: response })
      return toast.success('Operation saved.')
    }
    updateOperation(operationName, { name, method, endpoint, responseSchema: response })
  }, [endpoint, method, name, operationName, request, response, updateOperation])

  return (
    <div className="pr-4">
      <h3 className="text-xl font-semibold">
        {name} ({isSecure ? 'Secure' : 'Public'})
      </h3>
      <p className="text-lg">
        {method} - {endpoint}
      </p>
      <hr className="pb-4 mt-4" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h4 className="text-lg font-semibold">Request</h4>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                {request ? requestOptions.find((r) => request === r) : 'Select Request...'}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search Request Schema..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No schemas found.</CommandEmpty>
                  <CommandGroup>
                    {requestOptions.map((r) => (
                      <CommandItem
                        key={r}
                        value={r}
                        onSelect={() => {
                          setRequest(request === r ? '' : r)
                          setOpen(false)
                        }}
                      >
                        {r}
                        <Check className={cn('ml-auto', r === request ? 'opacity-100' : 'opacity-0')} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {request && (
            <div className="flex flex-col gap-2">
              <SchemaDisplay schemaName={request} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-lg font-semibold">Query</h4>
          <p className="text-muted-foreground">Coming soon!!!</p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-lg font-semibold">Response</h4>
          <Popover open={open2} onOpenChange={setOpen2}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open2} className="w-full justify-between">
                {response ? responseSchemaOptions.find((r) => response === r) : 'Select Response...'}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search Response Schema..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No schemas found.</CommandEmpty>
                  <CommandGroup>
                    {responseSchemaOptions.map((r) => (
                      <CommandItem
                        key={r}
                        value={r}
                        onSelect={() => {
                          setResponse(r)
                          setOpen2(false)
                        }}
                      >
                        {r}
                        <Check className={cn('ml-auto', r === response ? 'opacity-100' : 'opacity-0')} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <SchemaDisplay schemaName={response} />
        </div>
        <div className="flex gap-4 justify-end">
          <Button disabled={!isDirty} variant="secondary" onClick={reset}>
            Cancel
          </Button>
          <Button disabled={!isDirty} onClick={() => saveOperation()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function SchemaDisplay({ schemaName }: { schemaName: string }) {
  const { apex } = useApexStore()
  const schemas = useMemo(() => {
    const main = apex.schemas.find(({ name }) => name === schemaName)
    if (!main) return []
    const customSchemas = []
    const values = Object.values(main.fields)
    for (const value of values) {
      if (typeof value === 'string' && apex.schemas.find(({ name }) => name === value)) {
        customSchemas.push(value)
      } else if (typeof value === 'object' && value.type === 'array' && apex.schemas.find(({ name }) => name === value.arrayType)) {
        customSchemas.push(value.arrayType)
      }
    }
    return [main.name, ...customSchemas]
  }, [apex.schemas, schemaName])

  if (!schemas.length) return <p className="text-red-500">Schema "{schemaName}" not found.</p>
  console.log(schemas)
  return (
    <div className="border p-4 bg-card rounded-md font-mono text-sm">
      <pre>{schemas.map((s) => formatSchema(apex.schemas.find(({ name }) => name === s) as SchemaType, apex.schemas)).join('\n')}</pre>
    </div>
  )
}

function formatSchema(schema: SchemaType, allSchemas: SchemaType[], depth = 0): string {
  if (!schema.fields) return ''

  const customSchemas = []

  const indent = '  '.repeat(depth)
  let result = `${indent}interface ${schema.name} {\n`

  for (const [key, value] of Object.entries(schema.fields)) {
    const fieldType = resolveType(value, allSchemas, depth + 1)
    const isRequired = schema.required?.includes(key)

    if (['string', 'number', 'boolean', 'array'].includes(fieldType)) customSchemas.push(fieldType)

    result += `${indent}  ${key}${isRequired ? '' : '?'}: ${fieldType}\n`
  }

  result += `${indent}}\n`

  for (const customSchema of customSchemas) {
    if (customSchema === 'array') continue
    const referencedSchema = allSchemas.find(({ name }) => name === customSchema)
    if (referencedSchema) {
      result += formatSchema(referencedSchema, allSchemas, depth + 1)
    }
  }

  return result
}

function resolveType(
  value:
    | string
    | {
        type: 'array'
        arrayType: string
      },
  allSchemas: SchemaType[],
  depth: number
): string {
  // Handle primitives
  if (typeof value === 'string' && ['string', 'number', 'boolean'].includes(value)) {
    return value // Direct primitive types
  }

  // Handle arrays
  if (typeof value === 'object' && value.type === 'array') {
    return `${resolveType(value.arrayType, allSchemas, depth)}[]`
  }

  // Handle custom schema references
  if (typeof value === 'string') {
    const referencedSchema = allSchemas.find(({ name }) => name === value)
    if (referencedSchema) {
      return referencedSchema.name // Reference another schema
    }
  }

  return 'unknown' // Fallback for unsupported types
}

function CreateOperationDialog() {
  const { addOperation, apex } = useApexStore()
  const [name, setName] = useState('')
  const [method, setMethod] = useState<MethodEnumType | ''>('')

  const [open, setOpen] = useState(false)
  const [open2, setOpen2] = useState(false)

  const endpointOptions = useMemo(() => apex.endpoints.map(({ path }) => path), [apex.endpoints])
  const [endpoint, setEndpoint] = useState('')
  const methodOptions = useMemo(() => apex.endpoints.find((e) => e.path === endpoint)?.methods || [], [apex.endpoints, endpoint])

  const [responseSchema, setResponseSchema] = useState('')
  const responseSchemaOptions = useMemo(() => apex.schemas.map(({ name }) => name).filter((s) => s.endsWith('Response')), [apex.schemas])

  const closeRef = useRef<HTMLButtonElement>(null)

  const invalid = !name || !endpoint || !method || !responseSchema

  return (
    <DialogContent>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (invalid) return toast.error('Please fill out all fields.')
          const cleanName = name.replace(/[^\w]/g, '')
          if (apex.operations.find((o) => o.name === cleanName)) return toast.error('Operation already exists.')
          if (!method) return toast.error('Please select a method.')
          addOperation({ name: cleanName, endpoint, method, responseSchema })
          setName('')
          setMethod('')
          setEndpoint('')
          closeRef.current?.click()
        }}
      >
        <DialogHeader>
          <DialogTitle>{!name ? 'Create Operation' : name}</DialogTitle>
          <DialogDescription>Create a new operation!</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="User" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Endpoint</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                  {endpoint ? endpointOptions.find((e) => endpoint === e) : 'Select Endpoint...'}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search Endpoint..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No endpoints found.</CommandEmpty>
                    <CommandGroup>
                      {endpointOptions.map((e) => (
                        <CommandItem
                          key={e}
                          value={e}
                          onSelect={() => {
                            setEndpoint(endpoint === e ? '' : e)
                            setOpen(false)
                          }}
                        >
                          {e}
                          <Check className={cn('ml-auto', e === endpoint ? 'opacity-100' : 'opacity-0')} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(m: MethodEnumType) => setMethod(m)} disabled={!endpoint}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {methodOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Response</Label>
            <Popover open={open2} onOpenChange={setOpen2}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open2} className="w-full justify-between">
                  {responseSchema ? responseSchemaOptions.find((e) => responseSchema === e) : 'Select Response...'}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search Response Schema..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No schemas found.</CommandEmpty>
                    <CommandGroup>
                      {responseSchemaOptions.map((r) => (
                        <CommandItem
                          key={r}
                          value={r}
                          onSelect={() => {
                            setResponseSchema(responseSchema === r ? '' : r)
                            setOpen2(false)
                          }}
                        >
                          {r}
                          <Check className={cn('ml-auto', r === responseSchema ? 'opacity-100' : 'opacity-0')} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogClose ref={closeRef} />
        <DialogFooter>
          <Button disabled={invalid}>Create</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
