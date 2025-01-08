import { Button } from '@/components/ui/button'
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
import { Select, SelectContent, SelectItem, SelectGroup, SelectTrigger, SelectValue } from '@/components/ui/select'
import Go from '@/Go'
import { useApexStore } from '@/hooks/useApexStore'
import useDirAndName from '@/hooks/useDirAndName'
import useGo from '@/hooks/useGo'
import { GetServerStatusSchema } from '@/types/schemas'
import { Label } from '@radix-ui/react-dropdown-menu'
import { createLazyFileRoute } from '@tanstack/react-router'
import { GitPullRequestArrow, Trash } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/projects/$name/git')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const { loadApex } = useApexStore()
  const [status, refetchStatus] = useGo('', () => Go.git.status(dir))

  const [branch, refetchBranch] = useGo('', () => Go.git.branch(dir))
  const [branches, refetchBranches] = useGo<string[]>([], () => Go.git.branches(dir))
  const [stashes, refetchStashes] = useGo<{ index: number; hash: string; message: string }[]>([], () =>
    Go.git.stashes(dir).then((s) => s?.map((o) => ({ ...o, message: o.message.replace('Stash: ', '') })) ?? [])
  )
  const [commits, refetchCommits] = useGo<string[]>([], () => Go.git.commits(dir, 100))

  const [name, setName] = useState('')
  const [stashMsg, setStashMsg] = useState('')
  const [msg, setMsg] = useState('')

  const closeRef = useRef<HTMLButtonElement>(null)
  const closeDeleteRef = useRef<HTMLButtonElement>(null)
  const closeStashRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Git</h2>
          <Select
            value={branch}
            onValueChange={(v) =>
              Go.git
                .switchBranch(dir, v)
                .then(refetchBranch)
                .then(refetchStatus)
                .then(refetchCommits)
                .then(() => loadApex(dir))
                .then(() => {
                  Go.server.status(dir).then((status) => {
                    if (GetServerStatusSchema.parse(status).server === 'running')
                      Go.server
                        .restartServer(dir)
                        .then(() => {
                          toast.success('Server restarted')
                        })
                        .catch(() => toast.error('Failed to restart server'))
                  })
                })
                .catch((e) => {
                  toast.error('Failed to switch branch', { description: e })
                })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue>{branch}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {branches
                  .filter((v) => v !== branch)
                  .map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" onClick={refetchBranches}>
                + New Branch
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Branch</DialogTitle>
                <DialogDescription>Enter the name of the new branch</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!name) return toast('Please enter a branch name')
                  Go.git
                    .createBranch(dir, name)
                    .then(() => {
                      setName('')
                      refetchBranches()
                      refetchBranch()
                      closeRef.current?.click()
                    })
                    .catch((e) => toast('Failed to create branch', { description: e }))
                }}
              >
                <div className="mb-4">
                  <Input name="name" placeholder="Branch name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <DialogFooter>
                  <DialogClose ref={closeRef} />
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                - Delete Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Branch</DialogTitle>
                <DialogDescription>Are you sure you want to delete the current branch?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose ref={closeDeleteRef} />
                <Button
                  onClick={() => {
                    Go.git
                      .deleteBranch(dir)
                      .then(refetchBranch)
                      .then(refetchStatus)
                      .then(refetchBranches)
                      .then(refetchCommits)
                      .then(() => loadApex(dir))
                      .then(() => {
                        closeDeleteRef.current?.click()
                        Go.server.status(dir).then((status) => {
                          if (GetServerStatusSchema.parse(status).server === 'running')
                            Go.server
                              .restartServer(dir)
                              .then(() => {
                                toast.success('Server restarted')
                              })
                              .catch(() => toast.error('Failed to restart server'))
                        })
                      })
                      .catch((e) => {
                        toast.error('Failed to delete branch', { description: e })
                      })
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                Merge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make a merge</DialogTitle>
                <DialogDescription>Select a target and a source.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose ref={closeDeleteRef} />
                <Button onClick={() => {}}>Merge</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex gap-4">
          {!status ? <Label className="text-green-500">Up to date</Label> : <Label className="text-destructive">Dirty</Label>}
        </div>
      </div>
      <hr />
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Message</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!msg) return toast('Please enter a commit message')
            Go.git
              .commit(dir, msg)
              .then(refetchCommits)
              .then(() => {
                setMsg('')
                refetchStatus()
              })
              .catch(() => toast('Failed to commit'))
          }}
          className="flex gap-4"
        >
          <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Add changes" />
          <Button disabled={!status}>Commit</Button>
        </form>
      </div>
      <div className="flex">
        <div className="w-72 pr-4 border-r">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Changes</h3>
            {status && (
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="size-8" variant="secondary">
                      <GitPullRequestArrow className="size-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Stash Changes</DialogTitle>
                      <DialogDescription>Stash your changes</DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()

                        if (!stashMsg) return toast('Please enter a stash message')
                        Go.git
                          .stash(dir, stashMsg)
                          .then(refetchStatus)
                          .then(() => loadApex(dir))
                          .then(() => {
                            closeStashRef.current?.click()
                            Go.server.status(dir).then((status) => {
                              if (GetServerStatusSchema.parse(status).server === 'running')
                                Go.server
                                  .restartServer(dir)
                                  .then(() => {
                                    toast.success('Server restarted')
                                  })
                                  .catch(() => toast.error('Failed to restart server'))
                            })
                          })
                          .catch((e) => toast('Failed to stash changes', { description: e }))
                      }}
                    >
                      <div className="mb-4">
                        <Input name="name" placeholder="Stash message" value={stashMsg} onChange={(e) => setStashMsg(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <DialogClose ref={closeStashRef} />
                        <Button>Stash</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button
                  className="size-8"
                  variant="secondary"
                  onClick={() => {
                    Go.git
                      .discardChanges(dir)
                      .then(refetchStatus)
                      .then(() => loadApex(dir))
                      .catch((e) => toast('Failed to discard changes', { description: e }))
                  }}
                >
                  <Trash className="size-3" />
                </Button>
              </div>
            )}
          </div>

          {parseGitStatus(status.split('\n')).map(([group, changes]) => {
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
          <div className="h-64 flex flex-col gap-2 items-center justify-center">
            <h3 className="text-lg text-left w-full font-semibold">Stashes</h3>
            <div className="flex gap-2">
              <Select
                value={'Apply a stash...'}
                onValueChange={(i) =>
                  Go.git
                    .applyStash(dir, Number(i))
                    .then(refetchStatus)
                    .then(() => loadApex(dir))
                    .then(() => {
                      Go.server.status(dir).then((status) => {
                        if (GetServerStatusSchema.parse(status).server === 'running')
                          Go.server
                            .restartServer(dir)
                            .then(() => {
                              toast.success('Server restarted')
                            })
                            .catch(() => toast.error('Failed to restart server'))
                      })
                    })
                    .catch((e) => toast('Failed to apply stash', { description: e }))
                }
              >
                <SelectTrigger>
                  <SelectValue>Apply a stash...</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {stashes.map((stash) => (
                      <SelectItem key={stash.index} value={`${stash.index}`}>
                        {stash.message}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={'Delete a stash...'}
                onValueChange={(i) =>
                  Go.git
                    .deleteStash(dir, Number(i))
                    .then(refetchStashes)
                    .catch((e) => toast('Failed to delete stash', { description: e }))
                }
              >
                <SelectTrigger>Delete a stash...</SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {stashes.map((stash) => (
                      <SelectItem key={stash.index} value={`${stash.index}`}>
                        {stash.message}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex-1 pl-4">
          <h3 className="text-lg font-semibold">Commits</h3>
          <ul className="flex flex-col gap-2">
            {parseGitCommits(commits).map(({ hash, message, timestamp }) => (
              <li key={hash} className="flex justify-between gap-1">
                <span>{message}</span>
                <span className="text-small text-muted-foreground">{timestamp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
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

type GitCommitItem = {
  hash: string
  message: string
  author: string
  timestamp: string
  rawTime: Date
}

// Converts timestamps into human-readable format (e.g., "3 hours ago")
function formatTimestamp(dateString: string): string {
  const now = new Date()
  const commitDate = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - commitDate.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} days ago`
  return commitDate.toLocaleString() // Fallback to full timestamp
}

// Parses commit history into a flat array (newest first)
function parseGitCommits(commitLines: string[]): GitCommitItem[] {
  const commits: GitCommitItem[] = []

  for (const line of commitLines) {
    const match = line.match(/^🔹 ([a-f0-9]+) - (.+) \((.+)\)$/)
    if (!match) continue

    const [, hash, message, timestamp] = match
    commits.push({
      hash,
      message,
      author: 'Unknown', // Assuming author is not provided in the commit line
      timestamp: formatTimestamp(timestamp),
      rawTime: new Date(timestamp),
    })
  }

  return commits
}
