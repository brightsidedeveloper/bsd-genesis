import { Button } from '@/components/ui/button'
import Go from '@/Go'
import useDB from '@/hooks/useDB'
import useDirAndName from '@/hooks/useDirAndName'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GetSQLHistorySchema, GetSQLHistoryType } from '@/types/schemas'
import { cn } from '@/lib/utils'
import { useApexStore } from '@/hooks/useApexStore'
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
import { Input } from '@/components/ui/input'
import { TabsContent } from '@radix-ui/react-tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
export const Route = createLazyFileRoute('/projects/$name/queries')({
  component: RouteComponent,
})

function RouteComponent() {
  const { apex, originalApex, reset, saveApex } = useApexStore()

  const { dir } = useDirAndName()

  const [tab, setTab] = useState<'queries' | 'editor'>('queries')

  const [search, setSearch] = useState('')

  const isDirty = useMemo(() => !isEqual(apex, originalApex), [apex, originalApex])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">SQL Editor</h2>
        <Tabs value={tab} onValueChange={(t) => setTab(t as 'queries' | 'editor')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className={cn('flex gap-4', (!isDirty || tab === 'editor') && 'opacity-0 pointer-events-none')}>
          <Button disabled={!isDirty || tab === 'editor'} size="sm" variant="secondary" onClick={() => reset()}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => saveApex(dir)} disabled={!isDirty || tab === 'editor'}>
            Write File
          </Button>
        </div>
      </div>
      <hr />
      {tab === 'queries' ? (
        <>
          <div className="flex">
            <div className="flex-1 pr-4"></div>
            <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l px-4 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Queries</h3>
                <Dialog>
                  <DialogTrigger>
                    <Button size="sm">+ New</Button>
                  </DialogTrigger>
                  <CreateQueryDialog />
                </Dialog>
              </div>
              <Input className="mb-2" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            </ScrollArea>
          </div>
        </>
      ) : (
        <SQLEditor />
      )}
    </div>
  )
}

function CreateQueryDialog() {
  const { apex } = useApexStore()

  const [name, setName] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)

  const [open, setOpen] = useState(false)
  const [schema, setSchema] = useState('')

  const schemaOptions = useMemo(
    () =>
      apex?.schemas
        .filter(({ type }) => {
          return type === 'Custom'
        })
        .map(({ name }) => name) || [],
    [apex]
  )

  const invalid = !name || !schema

  const [tab, setTab] = useState<'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CUSTOM'>('SELECT')

  return (
    <DialogContent>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()

          closeRef.current?.click()
        }}
      >
        <DialogHeader>
          <DialogTitle>{!name ? 'Create Query' : name}</DialogTitle>
          <DialogDescription>Create a new query!</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="User" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <Tabs value={tab} onValueChange={(t) => setTab(t as 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CUSTOM')}>
            <div className="flex justify-center mb-4">
              <TabsList>
                <TabsTrigger value="SELECT">SELECT</TabsTrigger>
                <TabsTrigger value="INSERT">INSERT</TabsTrigger>
                <TabsTrigger value="UPDATE">UPDATE</TabsTrigger>
                <TabsTrigger value="DELETE">DELETE</TabsTrigger>
                <TabsTrigger value="CUSTOM">CUSTOM</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="SELECT">Select</TabsContent>
            <TabsContent value="INSERT">Insert</TabsContent>
            <TabsContent value="UPDATE">Update</TabsContent>
            <TabsContent value="DELETE">Delete</TabsContent>
            <TabsContent value="CUSTOM">
              <div className="flex flex-col gap-2">
                <Label>Custom</Label>
                <Textarea placeholder="Custom Query" />
              </div>
            </TabsContent>
          </Tabs>

          {/* <div className="flex flex-col gap-2">
            <Label>Select</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                  {schema ? schemaOptions.find((s) => schema === s) : 'Select Endpoint...'}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search Schema..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No endpoints found.</CommandEmpty>
                    <CommandGroup>
                      {schemaOptions.map((s) => (
                        <CommandItem
                          key={s}
                          value={s}
                          onSelect={() => {
                            setSchema(schema === s ? '' : s)
                            setOpen(false)
                          }}
                        >
                          {s}
                          <Check className={cn('ml-auto', s === schema ? 'opacity-100' : 'opacity-0')} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div> */}
          {/* <div className="flex flex-col gap-2">
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
          </div> */}
        </div>

        <DialogClose ref={closeRef} />
        <DialogFooter>
          <Button disabled={invalid}>Create</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function SQLEditor() {
  const { dir } = useDirAndName()
  const [sql, setSql] = useState('')
  const [running, setRunning] = useState(false)

  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const { connected } = useDB()

  const [sqlHistory, setSqlHistory] = useState<GetSQLHistoryType | null>(null)

  const invalidateSqlHistory = useCallback(() => {
    Go.sqlEditor
      .get(dir)

      .then(GetSQLHistorySchema.parse)
      .then(setSqlHistory)
      .catch(() => {
        toast.error('Failed to get sql history')
      })
  }, [dir])
  useEffect(invalidateSqlHistory, [invalidateSqlHistory])

  const sortedSqlHistory = useMemo(
    () => sqlHistory?.queries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [sqlHistory]
  )

  return (
    <div className="flex">
      <div className="flex-1 pr-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setRunning(true)
            Go.db
              .query(dir, sql)
              .then(async (res) => {
                if (res) {
                  setRows(res)
                } else setRows([])
                toast.success('Query executed successfully')
                const prev = sqlHistory?.queries.find((q) => q.query === sql)

                const save = () => {
                  Go.sqlEditor
                    .save(dir, sql)
                    .then(invalidateSqlHistory)
                    .catch(() => {
                      toast.error('Failed to save query')
                    })
                }

                if (!prev) return save()

                Go.sqlEditor
                  .del(dir, prev.id)
                  .then(save)
                  .catch(() => {
                    toast.error('Failed to delete old query')
                    save()
                  })
              })
              .catch(() => {
                toast.error('Failed to execute query')
              })
              .finally(() => {
                setRunning(false)
              })
          }}
          className="flex gap-4 items-end"
        >
          <Textarea
            value={sql}
            disabled={running || !connected}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault()
                buttonRef.current?.click()
              }
            }}
          />
          <Button ref={buttonRef} disabled={running || !connected}>
            Submit
          </Button>
        </form>

        {rows && (
          <>
            <hr className="my-4" />
            {!rows.length ? (
              <Label>No Rows Returned</Label>
            ) : (
              <ScrollArea className="w-[calc(100vw-1rem-13rem-2px-13rem)] pr-4 -mr-4 max-h-[calc(100vh-var(--header-height)-40px-64px)]">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow className="">
                      {Object.keys(rows[0]).map((col) => (
                        <TableCell key={col} className="font-medium">
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((val, j) => (
                          <TableCell key={j}>{JSON.stringify(val)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </>
        )}
      </div>
      <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l px-4 flex flex-col gap-2">
        {sortedSqlHistory?.map(({ id, query }) => (
          <TooltipProvider key={id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setSql(query)}>
                  <pre className="text-xs truncate w-40">{query}</pre>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{query}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </ScrollArea>
    </div>
  )
}
