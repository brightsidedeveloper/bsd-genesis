import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCaption, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import Go from '@/Go'
import useDB from '@/hooks/useDB'
import useDirAndName from '@/hooks/useDirAndName'
import { DialogClose } from '@radix-ui/react-dialog'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/projects/$name/tables')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const [table, setTable] = useState('')
  const { connected } = useDB()

  const [tables, setTables] = useState<string[]>([])
  const [activeTableCols, setActiveTableCols] = useState<[string, string][]>([])
  const tableRef = useRef(table)
  tableRef.current = table
  const refetchTables = useCallback(() => {
    if (!connected) return setTables([])
    Go.db
      .tables(dir)
      .then((res) => {
        console.log('📋 Tables received from Go:', res)
        if (res) {
          if (!res.includes(tableRef.current)) {
            setTable('')
            setActiveTableCols([])
          }
          setTables(res)
        } else toast.error('Failed to get tables')
      })
      .catch(() => toast.error('Could not get tables', { description: 'Is your server running?' }))
  }, [connected, dir])
  useEffect(refetchTables, [refetchTables])

  useEffect(() => {
    if (!table) return
    Go.db
      .getTablesCols(dir, table)
      .then((res) => {
        if (res) {
          setActiveTableCols(Object.entries(res))
        } else toast.error('Failed to get table columns')
      })
      .catch(() => toast.error('Could not get table columns', { description: 'Is your server running?' }))
  }, [dir, table])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Tables</h2>
          {connected && (
            <>
              <Select value={table} onValueChange={setTable}>
                <SelectTrigger className="w-[200px] h-8">
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">+ New</Button>
                </DialogTrigger>
                <CreateTableDialog tables={tables} refetchTables={refetchTables} />
              </Dialog>
              {table && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="-ml-2">
                      Drop
                    </Button>
                  </DialogTrigger>
                  <DropTableDialog table={table} refetchTables={refetchTables} />
                </Dialog>
              )}
            </>
          )}
        </div>
        <div className="flex gap-4">
          {connected ? <Label className="text-green-500">Connected</Label> : <Label className="text-destructive">Disconnected</Label>}
        </div>
      </div>
      <hr />
      <ScrollArea className="w-[calc(100vw-1rem-13rem-1px)] pr-4 -mr-4 max-h-[calc(100vh-var(--header-height)-40px-64px)] relative">
        <Table>
          <TableCaption>{table} editor</TableCaption>
          <TableHeader className="sticky top-0">
            <TableRow className="">
              {activeTableCols.map(([col, type]) => (
                <TableCell key={col} className="font-medium">
                  {col}: {type}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>{/* <TableCell className="font-medium">INV001</TableCell> */}</TableRow>
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

function CreateTableDialog({ tables, refetchTables }: { tables: string[]; refetchTables: () => void }) {
  const { dir } = useDirAndName()
  const [tableName, setTableName] = useState('')
  const [columns, setColumns] = useState([{ name: 'id', type: 'UUID' }])
  const invalid = tableName.length === 0 || tables.includes(tableName)

  const addColumn = () => setColumns([...columns, { name: '', type: 'TEXT' }])
  const updateColumn = (index: number, key: string, value: string) => {
    const newColumns = [...columns]
    newColumns[index][key] = value
    setColumns(newColumns)
  }

  const closeRef = useRef<HTMLButtonElement>(null)

  const createTable = async () => {
    if (!tableName) return toast.error('Table name cannot be empty')

    const columnDefs = Object.fromEntries(columns.map((col) => [col.name, col.type]))

    try {
      await Go.db.createTable(dir, tableName, columnDefs)
      closeRef.current?.click()
      refetchTables()
      toast.success(`Table ${tableName} created successfully!`)
    } catch (err: unknown) {
      console.error(err)
      toast.error('Failed to create table')
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Table</DialogTitle>
        <DialogDescription>
          You can modify the table name and columns here. Click on the "Create" button to create the table.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="User" value={tableName} onChange={(e) => setTableName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Columns</Label>
          {columns.map((col, i) => (
            <div key={i} className="flex gap-2">
              <Input type="text" placeholder="Column Name" value={col.name} onChange={(e) => updateColumn(i, 'name', e.target.value)} />
              <Select value={col.type} onValueChange={(v) => updateColumn(i, 'type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="INTEGER">Integer</SelectItem>
                  <SelectItem value="BOOLEAN">Boolean</SelectItem>
                  <SelectItem value="UUID">UUID</SelectItem>
                  <SelectItem value="TIMESTAMP">Timestamp</SelectItem>
                  <SelectItem value="DATE">Date</SelectItem>
                  <SelectItem value="TIME">Time</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          <Button size="sm" onClick={addColumn}>
            + Add Column
          </Button>
        </div>
      </div>
      <DialogFooter>
        <DialogClose ref={closeRef} />
        <Button disabled={invalid} onClick={createTable}>
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function DropTableDialog({ table, refetchTables }: { table: string; refetchTables: () => void }) {
  const { dir } = useDirAndName()

  const closeRef = useRef<HTMLButtonElement>(null)

  const dropTable = async () => {
    try {
      await Go.db.dropTable(dir, table)
      refetchTables()
      closeRef.current?.click()
      toast.success(`Table ${table} dropped successfully!`)
    } catch (err: unknown) {
      console.error(err)
      toast.error('Failed to drop table')
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Drop Table</DialogTitle>
        <DialogDescription>
          Are you sure you want to drop the table <span className="font-semibold">{table}</span>? This action is irreversible.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button ref={closeRef} variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <Button variant="destructive" onClick={dropTable}>
          Drop
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
