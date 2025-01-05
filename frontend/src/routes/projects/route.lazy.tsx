import { createLazyFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import logo from '@/assets/images/logo.png'
import {
  Aperture,
  AppWindowMac,
  ArrowLeft,
  Database,
  GitGraph,
  Package,
  PcCase,
  Replace,
  Ship,
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

export const Route = createLazyFileRoute('/projects')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { name, dir } = useDirAndName()

  function deleteProject() {
    Promise.all([Go.clients.stopDev(dir, 'web'), Go.clients.stopDev(dir, 'mobile'), Go.clients.stopDev(dir, 'desktop')]).then(() => {
      toast('Clients Stopped', { description: 'Clients stopped for ' + name })
      Go.server
        .stop(dir)
        .then(() => {
          toast('Server Stopped', { description: 'Server stopped for ' + name })
          Go.projects
            .delete(dir)
            .then(() => {
              navigate({ to: '/' })
              toast(name + ' deleted', { description: '/Genesis/projects/' + dir })
            })
            .catch(() => toast('Error', { description: 'Failed to delete project' }))
        })
        .catch(() => toast('Error', { description: 'Failed to stop server' }))
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b pl-52 py-2">
        <h1 className="text-3xl px-4 font-bold">{name}</h1>
      </header>
      <aside className="bg-card min-h-screen overflow-y-auto w-52 fixed top-0 left-0 px-4 pb-4 flex flex-col gap-3 border-r">
        <img src={logo} alt="logo" className="w-full" />
        <div className="flex-1 flex flex-col gap-2">
          <Link
            to="/"
            className="py-1 px-2 rounded-lg hover:bg-primary/15 flex items-center gap-2 mb-2"
            activeProps={{
              className: 'bg-primary/10',
            }}
          >
            <ArrowLeft className="size-5" />
            Back to Projects
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
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={deleteProject}>
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
  { to: '/projects/$name/server', label: 'Server', Icon: PcCase },
  { to: '/projects/$name/clients', label: 'Clients', Icon: AppWindowMac },
  { to: '/projects/$name/apex', label: 'APEX', Icon: Aperture },
  { to: '/projects/$name/auth', label: 'Authentication', Icon: Users },
  { to: '/projects/$name/tables', label: 'Tables', Icon: Table },
  { to: '/projects/$name/queries', label: 'Queries', Icon: Replace },
  { to: '/projects/$name/q1', label: 'Q1 Storage', Icon: Database },
  { to: '/projects/$name/gpack', label: 'G-Pack', Icon: Package },
  { to: '/projects/$name/git', label: 'Git', Icon: GitGraph },
  { to: '/projects/$name/deploy', label: 'Deploy', Icon: Ship },
] as const

// Next Steps:

// 4. Setup Client Spawner in App
// 5. Setup APEX
// 6. Setup Authentication
// 7. Setup Tables
// 8. Setup Queries
// 9. Setup Q1 Storage
// 10. Setup G-Pack
// 11. Setup Deploy
