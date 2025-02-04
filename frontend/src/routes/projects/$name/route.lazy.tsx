import { createLazyFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import logo from '@/assets/images/logo.png'
import {
  Aperture,
  ArrowLeft,
  Braces,
  BugOff,
  Database,
  Earth,
  GitGraph,
  Github,
  Keyboard,
  Package,
  Ship,
  Signpost,
  Sun,
  Table,
  TableOfContents,
  Trash,
  Users,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import Go from '@/Go'
import useDirAndName from '@/hooks/useDirAndName'
import { toast } from 'sonner'
import { useApexStore } from '@/hooks/useApexStore'
import { useEffect, useState } from 'react'
import { GetClientDevServersSchema, GetServerStatusSchema } from '@/types/schemas'

export const Route = createLazyFileRoute('/projects/$name')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { name, dir } = useDirAndName()

  const { clear, loadApex } = useApexStore()
  useEffect(() => {
    clear()
    loadApex(dir)
  }, [clear, loadApex, dir])

  const [deleting, setDeleting] = useState(false)

  async function deleteProject() {
    setDeleting(true)
    try {
      await Go.clients
        .devServers(dir)
        .then((s) => GetClientDevServersSchema.parse(s))
        .then((servers) => {
          const promises = []
          if (servers.web) promises.push(Go.clients.stopDev(dir, 'web'))
          if (servers.mobile) promises.push(Go.clients.stopDev(dir, 'mobile'))
          if (servers.desktop) promises.push(Go.clients.stopDev(dir, 'desktop'))
          if (promises.length === 0) return
          return Promise.all(promises)
            .then(() => {
              toast('Clients Stopped', { description: 'Clients stopped for ' + name })
            })
            .catch(() => {
              toast('Error', { description: 'Failed to stop clients' })
            })
        })
      await Go.server
        .status(dir)
        .then((s) => GetServerStatusSchema.parse(s))
        .then((status) => {
          if (status.db === 'running' || status.server === 'running') {
            return Go.server
              .stop(dir)
              .then(() => {
                toast('Server Stopped', { description: 'Server stopped for ' + name })
              })
              .catch(() => {
                toast('Error', { description: 'Failed to stop server' })
              })
          }
        })
    } catch (error: unknown) {
      console.error(error)
      toast('Error', { description: 'Failed to stop clients/server' })
    }

    Go.projects
      .delete(dir)
      .then(() => {
        navigate({ to: '/' })
        toast(name + ' deleted', {
          description: '/Genesis/projects/' + dir,
        })
      })
      .catch(() => toast('Error', { description: 'Failed to delete project' }))
      .finally(() => setDeleting(false))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b pl-52 py-2 h-[--header-height] flex items-center justify-between">
        <h1 className="text-3xl px-4 font-bold">{name}</h1>
        <div className="px-4">
          <Button
            variant="secondary"
            onClick={() =>
              Go.projects
                .open(dir)
                .then(() => toast('Opened in VSCode'))
                .catch(() => toast('Failed to open in VSCode'))
            }
          >
            code .
          </Button>
        </div>
      </header>
      <aside className="bg-card min-h-screen overflow-y-auto w-52 fixed top-0 left-0 px-4 pb-4 flex flex-col gap-3 border-r">
        <img src={logo} alt="logo" className="w-full -mt-1.5" />
        <div className="flex-1 flex flex-col gap-2 -translate-y-1">
          <Link
            to="/projects-list"
            className="py-1 px-2 rounded-lg hover:bg-primary/15 flex items-center gap-2 mb-2"
            activeProps={{
              className: 'bg-primary/10',
            }}
          >
            <ArrowLeft className="size-5" />
            Solar Systems
          </Link>
          {routes.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              params={{ name }}
              className="py-1 px-2 rounded-lg hover:bg-primary/15 flex items-center gap-2"
              activeProps={{
                className: 'bg-primary/10',
              }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <button className="py-1 px-2 rounded-lg hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2 text-destructive">
                <Trash className="size-5" />
                Delete Project
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogDescription>Are you sure you want to delete this project?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <div className="flex items-center gap-4 justify-between">
                  <DialogClose asChild>
                    <Button disabled={deleting} variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button disabled={deleting} variant="destructive" onClick={deleteProject}>
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </aside>
      <div className="pl-52 flex flex-1">
        <main className="p-4 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const routes = [
  { to: '/projects/$name', label: 'Overview', Icon: TableOfContents },
  { to: '/projects/$name/server', label: 'Star', Icon: Sun },
  { to: '/projects/$name/clients', label: 'Planets', Icon: Earth },
  { to: '/projects/$name/auth', label: 'Auth', Icon: Users },
  { to: '/projects/$name/tables', label: 'Tables', Icon: Table },
  { to: '/projects/$name/queries', label: 'SQL', Icon: Keyboard },
  { to: '/projects/$name/schemas', label: 'Schemas', Icon: Braces },
  { to: '/projects/$name/endpoints', label: 'Endpoints', Icon: Signpost },
  { to: '/projects/$name/apex', label: 'APEX', Icon: Aperture },
  { to: '/projects/$name/q1', label: 'Q1 Storage', Icon: Database },
  { to: '/projects/$name/tspack', label: 'Starships', Icon: Package },
  { to: '/projects/$name/git', label: 'Git', Icon: GitGraph },
  { to: '/projects/$name/github-actions', label: 'Actions', Icon: Github },
  { to: '/projects/$name/deploy', label: 'Deploy', Icon: Ship },
  { to: '/projects/$name/sentry', label: 'Logs', Icon: BugOff },
] as const
