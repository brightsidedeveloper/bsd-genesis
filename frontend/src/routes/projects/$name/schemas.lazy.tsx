import { ScrollArea } from '@/components/ui/scroll-area'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects/$name/schemas')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Schemas</h2>
      <hr />
      <div className="flex relative">
        <ScrollArea className="flex-1 h-[calc(100vh-var(--header-height)-40px-64px)]"></ScrollArea>
        <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l px-4 flex flex-col gap-2">
          <h3 className="text-lg font-semibold">Schemas</h3>
        </ScrollArea>
      </div>
    </div>
  )
}
