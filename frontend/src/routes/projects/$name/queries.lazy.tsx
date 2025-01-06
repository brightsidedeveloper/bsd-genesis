import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Go from '@/Go'
import useDB from '@/hooks/useDB'
import useDirAndName from '@/hooks/useDirAndName'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
export const Route = createLazyFileRoute('/projects/$name/queries')({
  component: RouteComponent,
})

function RouteComponent() {
  const { connected } = useDB()

  const { dir } = useDirAndName()
  const [sql, setSql] = useState('')
  const [running, setRunning] = useState(false)

  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null)

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setRunning(true)
          Go.db
            .query(dir, sql)
            .then((res) => {
              if (res) {
                setRows(res)
              } else setRows([])
              toast.success('Query executed successfully')
            })
            .catch(() => {
              toast.error('Failed to execute query')
            })
            .finally(() => {
              setRunning(false)
            })
        }}
        className="flex gap-4"
      >
        <Input value={sql} disabled={running || !connected} onChange={(e) => setSql(e.target.value)} />
        <Button disabled={running || !connected}>Submit</Button>
      </form>

      {rows && (
        <>
          <hr className="my-4" />
          {!rows.length ? (
            <Label>No Rows Returned</Label>
          ) : (
            <ScrollArea className="w-[calc(100vw-1rem-13rem-1px)] pr-4 -mr-4 max-h-[calc(100vh-var(--header-height)-40px-64px)] relative">
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
  )
}
