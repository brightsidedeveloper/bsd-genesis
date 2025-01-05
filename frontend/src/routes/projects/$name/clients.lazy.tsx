import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import Go from '@/Go'
import useDirAndName from '@/hooks/useDirAndName'
import { GetClientAppsSchema, GetClientAppsType, GetClientDevServersSchema, GetClientDevServersType } from '@/types/schemas'
import { createLazyFileRoute } from '@tanstack/react-router'
import { FileTerminal, Trash } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/projects/$name/clients')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const [apps, setApps] = useState<GetClientAppsType | null>(null)
  const refetchClients = useCallback(() => {
    Go.clients.get(dir).then((a) => setApps(GetClientAppsSchema.parse(a)))
  }, [dir])
  useEffect(refetchClients, [refetchClients])

  const [devRunning, setDevRunning] = useState<GetClientDevServersType>({ web: false, mobile: false, desktop: false })
  const refetchDev = useCallback(() => {
    Go.clients.devServers(dir).then((a) => setDevRunning(GetClientDevServersSchema.parse(a)))
  }, [dir])
  useEffect(refetchDev, [refetchDev])

  const [creating, setCreating] = useState(false)

  const [bashing, setBashing] = useState(false)

  const [cmd, setCmd] = useState('')

  const [terminal, setTerminal] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!scrollRef.current) return
      console.log(`${scrollRef.current.scrollHeight}`)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 100)
    return () => clearTimeout(t)
  }, [terminal])

  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Clients</h2>
      <hr />
      <h3 className="text-lg font-semibold">Terminal</h3>
      {terminal ? (
        <div ref={scrollRef} className="h-44 overflow-y-auto">
          <pre className="text-wrap">{terminal}</pre>
        </div>
      ) : (
        <div className="h-44 flex flex-col gap-4 items-center justify-center">
          <FileTerminal />
          <p>Run a Bash Command!</p>
        </div>
      )}
      <hr />
      <h3 className="text-lg font-semibold">Apps</h3>
      <div className="grid grid-cols-2 gap-4">
        {apps?.map((app, i) => {
          const serverRunning = devRunning[app.type]
          return (
            <Card key={i} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="capitalize flex items-center justify-between">
                  <span>{app.type}</span>
                  {app.exists && (
                    <Dialog>
                      <DialogTrigger>
                        <Trash className="text-destructive size-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you sure?</DialogTitle>
                          <DialogDescription>
                            This will delete the project and all of its files. This action is irreversible.
                          </DialogDescription>
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
                                setBashing(true)
                                const next = () => {
                                  Go.clients
                                    .delete(dir, app.type)
                                    .then(() => {
                                      closeRef.current?.click()
                                      refetchClients()
                                      toast(app.type.slice(0, 1).toUpperCase() + app.type.slice(1) + ' deleted.')
                                    })
                                    .catch(() => {
                                      toast('Failed to delete project', { description: 'That stinks, my bad' })
                                    })
                                    .finally(() => setBashing(false))
                                }
                                if (serverRunning) {
                                  Go.clients
                                    .stopDev(dir, app.type)
                                    .then(() => {
                                      toast('Dev server stopped')
                                      next()
                                    })
                                    .catch(() => {
                                      toast('Failed to stop dev server', { description: 'That stinks, my bad' })
                                    })
                                } else {
                                  next()
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardTitle>
                <CardDescription>{app.exists ? 'Open Project' : 'Create Project'}</CardDescription>
              </CardHeader>
              {app.exists && (
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Label>Run Bash</Label>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (bashing) return
                        setBashing(true)
                        Go.clients
                          .bash(dir, app.type, cmd)
                          .then((output) => {
                            setTerminal((c) => c + '\n' + cmd + '\n' + output)
                            toast('Bash ran successfully')
                            setCmd('')
                          })
                          .catch(() => {
                            toast('Failed to run bash', { description: 'That stinks, my bad' })
                          })
                          .finally(() => setBashing(false))
                      }}
                      className="flex gap-2"
                    >
                      <Input placeholder="npm i" value={cmd} onChange={(e) => setCmd(e.target.value)} />
                      <Button disabled={bashing}>Run</Button>
                    </form>
                  </div>
                </CardContent>
              )}
              <CardFooter>
                <div className="flex items-center justify-between w-full">
                  {app.exists ? (
                    serverRunning ? (
                      <Button
                        disabled={bashing}
                        onClick={() => {
                          setBashing(true)
                          Go.clients
                            .stopDev(dir, app.type)
                            .then((bash) => {
                              setTerminal((c) => c + '\n' + bash)
                              refetchDev()
                              toast('Dev server stopped')
                            })
                            .catch(() => {
                              toast('Failed to stop dev server', { description: 'That stinks, my bad' })
                            })
                            .finally(() => setBashing(false))
                        }}
                      >
                        Stop Dev
                      </Button>
                    ) : (
                      <Button
                        disabled={bashing}
                        onClick={() => {
                          setBashing(true)
                          Go.clients
                            .startDev(dir, app.type)
                            .then((bash) => {
                              setTerminal((c) => c + '\n' + bash)
                              refetchDev()
                              toast('Dev server started')
                            })
                            .catch(() => {
                              toast('Failed to start dev server', { description: 'That stinks, my bad' })
                            })
                            .finally(() => setBashing(false))
                        }}
                      >
                        Run Dev
                      </Button>
                    )
                  ) : (
                    <div />
                  )}
                  <Button
                    disabled={creating || bashing}
                    onClick={() => {
                      if (app.exists) {
                        Go.clients.open(dir, app.type)
                        return
                      }
                      setCreating(true)
                      Go.clients
                        .create(dir, app.type)
                        .then(() => {
                          setBashing(true)
                          Go.clients
                            .bash(dir, app.type, 'npm i')
                            .then((output) => {
                              setTerminal((c) => c + '\n' + output)
                              toast('Project created')
                              refetchClients()
                            })
                            .catch(() => {
                              toast('Failed to run npm i', { description: 'That stinks, my bad' })
                            })
                            .finally(() => setBashing(false))
                        })
                        .catch(() => {
                          toast('Failed to create project', { description: 'That stinks, my bad' })
                        })
                        .finally(() => {
                          setCreating(false)
                        })
                    }}
                  >
                    {app.exists ? 'code .' : 'Create'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
