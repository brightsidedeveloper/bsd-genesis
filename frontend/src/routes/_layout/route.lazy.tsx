import { createLazyFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import logo from '@/assets/images/logo.png'
import { FolderCog, Library, Package, Settings } from 'lucide-react'

export const Route = createLazyFileRoute('/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  const pathname = useLocation().pathname
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b pl-52 py-2">
        <h1 className="text-3xl px-4 font-bold capitalize">{pathname.split('/')[1] || 'projects'}</h1>
      </header>
      <aside className="bg-card min-h-screen overflow-y-auto w-52 fixed top-0 left-0 px-4 pb-4 flex flex-col gap-3 border-r">
        <img src={logo} alt="logo" className="w-full -mt-1.5" />
        <div className="flex-1 flex flex-col gap-2 -translate-y-1">
          {routes.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
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
        <Link
          to="/settings"
          className="py-1 px-2 rounded-lg hover:bg-primary/15 flex items-center gap-2"
          activeProps={{
            className: 'bg-primary/10',
          }}
        >
          <Settings className="size-5" />
          Settings
        </Link>
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
  { to: '/', label: 'Projects', Icon: FolderCog },
  { to: '/modules', label: 'Go Modules', Icon: Library },
  { to: '/packages', label: 'Node Packages', Icon: Package },
] as const
