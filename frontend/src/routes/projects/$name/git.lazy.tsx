import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Go from '@/Go'
import useDirAndName from '@/hooks/useDirAndName'
import { Label } from '@radix-ui/react-dropdown-menu'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/projects/$name/git')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const { status, clean, refetch } = useGit()

  const [msg, setMsg] = useState('')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Git</h2>
        <div className="flex gap-4">
          {clean ? <Label className="text-green-500">Up to date</Label> : <Label className="text-destructive">Dirty</Label>}
        </div>
      </div>
      <hr />
      <div className="flex flex-col gap-2">
        <Label>Message</Label>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!msg) return toast('Please enter a commit message')
            Go.git
              .commit(dir, msg)
              .then(() => {
                setMsg('')
                refetch()
              })
              .catch(() => toast('Failed to commit'))
          }}
          className="flex gap-4"
        >
          <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Add changes" />
          <Button disabled={clean}>Commit</Button>
        </form>
      </div>
      <div className="flex">
        <div className="w-52 pr-4 border-r">
          {status.map(([group, changes]) => {
            if (!changes.length) return null
            return (
              <>
                <p className="font-bold">{group}</p>
                <ul>
                  {changes.map((change) => (
                    <li key={change.path}>
                      {change.type} {change.file}
                    </li>
                  ))}
                </ul>
              </>
            )
          })}
        </div>
        <div className="flex-1"></div>
      </div>
    </div>
  )
}

function useGit() {
  const { dir } = useDirAndName()

  const [status, setStatus] = useState('')
  const refetch = useCallback(() => {
    Go.git.status(dir).then(setStatus).catch(console.error)
  }, [dir])
  useEffect(refetch, [refetch])
  //Use Go!
  const [branch, setBranch] = useState('')
  const [commit, setCommit] = useState('')
  const [remote, setRemote] = useState('')

  const [branches, setBranches] = useState<string[]>([])
  const [commits, setCommits] = useState<string[]>([])
  return {
    status: parseGitStatus(status.split('\n')),
    clean: !status,
    branch,
    commit,
    remote,
    branches,
    commits,
    refetch,
  }
}

type GitStatusItem = {
  type: string
  path: string
  file: string
}

type GitStatusGroups = {
  root: GitStatusItem[]
  web: GitStatusItem[]
  desktop: GitStatusItem[]
  mobile: GitStatusItem[]
  genesis: GitStatusItem[]
  other: GitStatusItem[]
}

function parseGitStatus(statusLines: string[]): [string, GitStatusItem[]][] {
  const groups: GitStatusGroups = {
    root: [],
    genesis: [],
    web: [],
    desktop: [],
    mobile: [],
    other: [],
  }

  for (const line of statusLines) {
    const match = line.match(/^(\?\?|\s?[MADRC])\s+(.+)$/)
    if (!match) continue

    const [, type, fullPath] = match
    const parts = fullPath.split('/')
    const fileName = parts[parts.length - 1]

    if (parts.length === 1) {
      groups.root.push({ type: type.trim(), path: fullPath, file: fileName })
    } else {
      const groupName = parts.find((folder) => ['web', 'desktop', 'mobile', 'genesis'].includes(folder))

      if (groupName && groups[groupName as keyof GitStatusGroups]) {
        groups[groupName as keyof GitStatusGroups].push({
          type: type.trim(),
          path: fullPath,
          file: fileName,
        })
      } else {
        groups.other.push({ type: type.trim(), path: fullPath, file: fileName })
      }
    }
  }

  return Object.entries(groups)
}
