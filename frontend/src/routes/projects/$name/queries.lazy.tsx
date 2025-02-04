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
import { createPortal } from 'react-dom'
import { Trash } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
        <h2 className="text-2xl font-semibold">
          SQL {tab === 'queries' ? 'Queries' : 'Editor'}
          {tab === 'editor' && <>&nbsp;&nbsp;&nbsp;&nbsp;</>}
        </h2>
        <Tabs value={tab} onValueChange={(t) => setTab(t as 'queries' | 'editor')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
          </TabsList>
        </Tabs>
        <div id="portal-connected" className="w-fit relative">
          <div className={cn('flex gap-4', (!isDirty || tab === 'editor') && 'opacity-0 pointer-events-none')}>
            <Button disabled={!isDirty || tab === 'editor'} size="sm" variant="secondary" onClick={() => reset()}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => saveApex(dir)} disabled={!isDirty || tab === 'editor'}>
              Write File
            </Button>
          </div>
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
  const { dir } = useDirAndName()

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

  const { connected } = useDB()
  const [tables, setTables] = useState<string[]>([])
  const [table, setTable] = useState('')
  useEffect(() => {
    if (!connected) return
    Go.db
      .tables(dir)
      .then((res) => {
        console.log('📋 Tables received from Go:', res)
        if (res) setTables(res)
        else toast.error('Failed to get tables')
      })
      .catch(() => toast.error('Could not get tables', { description: 'Is your server running?' }))
  }, [connected, dir])

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
            <TabsContent value="CUSTOM">
              <div className="flex flex-col gap-2">
                <Label>Custom</Label>
                <Textarea placeholder="Custom Query" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="User" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {connected && (
            <div className="flex flex-col gap-2">
              <Label>Table</Label>
              <Select value={table} onValueChange={setTable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
      {createPortal(
        <div className="absolute z-10 top-1/2 -translate-y-1/2 right-4">
          {connected ? <Label className="text-green-500">Connected</Label> : <Label className="text-destructive">Disconnected</Label>}
        </div>,
        document.getElementById('portal-connected')!
      )}
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
      <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l pl-4 flex flex-col gap-2">
        {sortedSqlHistory?.map(({ id, query }) => (
          <TooltipProvider key={id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5">
                  <button className={cn('hover:bg-primary/10 rounded-lg p-1.5 cols-span-3')} onClick={() => setSql(query)}>
                    <pre className="text-xs truncate w-36">{query}</pre>
                  </button>
                  <button
                    className="col-span-1"
                    onClick={() =>
                      Go.sqlEditor
                        .del(dir, id)
                        .then(invalidateSqlHistory)
                        .catch(() => toast.error('Failed to delete query'))
                    }
                  >
                    <Trash className="size-4 text-destructive hover:brightness-110" />
                  </button>
                </div>
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
