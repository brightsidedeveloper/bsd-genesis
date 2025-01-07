import Go from '@/Go'
import { nameToDir } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/projects/$name/git')({
  beforeLoad({ params: { name } }) {
    return { name }
  },
  async loader({ context: { name } }) {
    await Go.git.init(nameToDir(name ?? '')).catch(() => toast.error('Failed to initialize git repository'))
  },
})
