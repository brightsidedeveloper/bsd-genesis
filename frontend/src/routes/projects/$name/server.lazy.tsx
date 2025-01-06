import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Go from '@/Go'
import useDirAndName from '@/hooks/useDirAndName'
import { cn } from '@/lib/utils'
import { GetServerStatusSchema, GetServerStatusType } from '@/types/schemas'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/projects/$name/server')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir, name } = useDirAndName()

  const [starting, setStarting] = useState(true)
  const [stopping, setStopping] = useState(true)

  const [status, setStatus] = useState<GetServerStatusType | null>(null)
  const refetchStatus = useCallback(() => {
    Go.server
      .status(dir)
      .then((status) => setStatus(GetServerStatusSchema.parse(status)))
      .catch(() => setStatus(null))
  }, [dir])
  useEffect(() => {
    refetchStatus()
    const i = setInterval(refetchStatus, 1000)
    return () => clearInterval(i)
  }, [refetchStatus])

  useEffect(() => {
    const t = setTimeout(() => {
      setStarting(false)
      setStopping(false)
    }, 100)
    return () => clearTimeout(t)
  }, [status?.db, status?.server])

  const [port, setPort] = useState('')
  const [realPort, setRealPort] = useState('')
  const refetchPort = useCallback(() => {
    Go.server
      .getPort(dir)
      .then((port) => {
        setPort(port)
        setRealPort(port)
      })
      .catch(() => {
        setPort('')
        setRealPort('')
      })
  }, [dir])
  useEffect(refetchPort, [refetchPort])

  function updatePort() {
    if (!port) return toast('Port is empty', { description: 'Port cannot be empty' })
    Go.server.updatePort(dir, port).then(() => {
      refetchPort()
      toast('Port Updated', {
        description: 'Port updated to ' + port,
      })
      if (status?.server === 'stopped') return
      Go.server
        .restartServer(dir)
        .then(() => {
          refetchStatus()
          toast('Server Restarted', {
            description: name + ' restarted on port ' + port,
          })
        })
        .catch(() =>
          toast('Failed to Restart Server', {
            description: name + ' failed to restart',
          })
        )
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Server</h2>
      <hr />
      <h3 className="text-lg font-semibold">Status</h3>
      <div className="flex space-x-4 items-center">
        <Label>Server: </Label>
        <span className={cn('capitalize', status && (status.server === 'running' ? 'text-green-500' : 'text-destructive'))}>
          {status ? status.server : ''}
        </span>
      </div>
      <div className="flex space-x-4 items-center">
        <Label>Database: </Label>
        <span className={cn('capitalize', status && (status.db === 'running' ? 'text-green-500' : 'text-destructive'))}>
          {status ? status.db : ''}
        </span>
      </div>
      <div className="flex space-x-4 items-center">
        <Label>URLs: </Label>
        <span>{status?.server === 'running' ? 'http://localhost:' + realPort : 'None'}</span>
      </div>
      <hr />
      <h3 className="text-lg font-semibold">Control</h3>
      <div className="flex space-x-4 items-center">
        <Label>Port</Label>
        <Input placeholder="Port" value={port} onChange={(e) => setPort(e.target.value)} />
        <Button onClick={updatePort}>Save</Button>
      </div>
      <div className="flex space-x-4">
        <Button
          disabled={starting || stopping}
          className={cn((status?.server === 'stopped' || status?.db === 'stopped') && 'bg-green-500 text-primary hover:bg-green-600')}
          variant="secondary"
          onClick={() => {
            if (status?.server === 'running') {
              setStarting(true)
              Go.server
                .restartServer(dir)
                .then(() =>
                  toast('Server Restarted', {
                    description: name + ' restarted on port ' + port,
                  })
                )
                .catch(() =>
                  toast('Failed to Restart Server', {
                    description: name + ' failed to restart',
                  })
                )
              return
            }
            setStarting(true)
            Go.server
              .start(dir)
              .then(() => {
                refetchStatus()

                toast('Server started', {
                  description: name + ' started on port ' + port,
                })
              })
              .catch(() =>
                toast('Server failed to start', {
                  description: name + ' failed to start',
                })
              )
              .finally(() => setStarting(false))
          }}
        >
          {status?.server === 'running' ? 'Restart Server' : 'Start Server'}
        </Button>
        <Button
          disabled={status?.server === 'stopped' || status?.db === 'stopped' || starting || stopping}
          variant="destructive"
          onClick={() => {
            setStopping(true)
            Go.server
              .stop(dir)
              .then(() => {
                refetchStatus()

                toast('Server stopped', {
                  description: name + ' stopped',
                })
              })
              .catch(() =>
                toast('Server failed to stop', {
                  description: name + ' failed to stop',
                })
              )
              .finally(() => setStopping(false))
          }}
        >
          Stop Server
        </Button>
      </div>
    </div>
  )
}
