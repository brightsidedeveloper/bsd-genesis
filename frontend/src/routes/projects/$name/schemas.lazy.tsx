import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'
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

export const Route = createLazyFileRoute('/projects/$name/schemas')({
  component: RouteComponent,
})

function RouteComponent() {
  const [schema, setSchema] = useState<string>('')

  const [edit, setEdit] = useState(false)

  useEffect(() => {
    setEdit(false)
  }, [schema])

  const data = false
  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Schemas</h2>
      <hr />
      <div className="flex relative">
        <ScrollArea className="flex-1 h-[calc(100vh-var(--header-height)-40px-64px)]">
          {schema ? (
            <div className="flex flex-col gap-4  pr-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{schema}</h3>
                <div className="flex gap-4">
                  <Dialog>
                    <DialogTrigger>
                      <Trash className="size-4 text-destructive" />
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete {schema}</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this schema?</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button ref={closeRef} variant="secondary">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button variant="destructive">Delete</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button onClick={() => setEdit((prev) => !prev)} size="sm">
                    {edit ? 'Save' : 'Edit'}
                  </Button>
                </div>
              </div>
              {data ? edit ? <>Editor</> : <>Preview</> : <p className="text-gray-500">No schema selected.</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h3 className="text-lg font-semibold">Select or create a schema</h3>
            </div>
          )}
        </ScrollArea>
        <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l pl-4 pb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Schemas</h3>
            <Button onClick={() => {}} size="sm" className="font-light hover:text-blue-500">
              + New
            </Button>
          </div>
          <Input className="mb-2" placeholder="Search" />
          <div className="flex flex-col gap-2">
            {['User'].map((s) => (
              <button
                key={s}
                onClick={() => setSchema((c) => (c === s ? '' : s))}
                className={cn(s === schema && 'bg-primary/15', 'hover:bg-primary/10 rounded-lg p-2')}
              >
                {s}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
