import Go from '@/Go'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Welcome to Genesis - Creator of Universes
      <br />
      <button
        onClick={() => {
          Go.app.openBrowser('https://github.com/brightsidedeveloper')
        }}
        className="hover:underline text-blue-500"
      >
        By BrightSideDeveloper
      </button>
    </div>
  )
}
