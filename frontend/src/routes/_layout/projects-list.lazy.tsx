import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GetProjectsType,
  GetProjectsSchema,
  CreateProjectSchema,
} from '@/types/schemas'
import Go from '@/Go'
import { nameToDir } from '@/lib/utils'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

export const Route = createLazyFileRoute('/_layout/projects-list')({
  component: RouteComponent,
})

function RouteComponent() {
  const [projects, setProjects] = useState<GetProjectsType | null>(null)

  const refetch = useCallback(() => {
    Go.projects.get().then((p) => setProjects(GetProjectsSchema.parse(p)))
  }, [])

  useEffect(refetch, [refetch])

  const projectDirAndNameTuple = useMemo(
    () => projects?.map(({ dir, project: { name } }) => [dir, name]) ?? [],
    [projects],
  )

  return (
    <div className="grid grid-cols-3 gap-4">
      {projects?.map(({ dir, project: { name, description } }) => (
        <Link key={dir} to="/projects/$name" params={{ name }}>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="ml-auto">Open</Button>
            </CardFooter>
          </Card>
        </Link>
      ))}
      <Dialog>
        <DialogTrigger>
          <Card className="size-full flex items-center justify-center border-dashed min-h-40">
            <Plus className="group-hover:opacity-100 opacity-70" />
          </Card>
        </DialogTrigger>
        <CreateProject
          refetch={refetch}
          projectDirAndNameTuple={projectDirAndNameTuple}
        />
      </Dialog>
    </div>
  )
}

function CreateProject({
  refetch,
  projectDirAndNameTuple,
}: {
  refetch: () => void
  projectDirAndNameTuple: string[][]
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [database, setDatabase] = useState<'postgres' | ''>('')

  function handleSubmit() {
    if (!name)
      return toast('Name is Required ', {
        description: 'Please fill out all fields.',
      })
    if (!database)
      return toast('Database is Required', {
        description: 'Please fill out all fields.',
      })
    const trimmedName = name.trim()
    const dir = nameToDir(trimmedName)
    if (
      projectDirAndNameTuple.some(
        ([d, n]) =>
          d === dir || n.toLowerCase().includes(trimmedName.toLowerCase()),
      )
    )
      return toast('Project Already Exists', {
        description: 'Please choose a different name.',
      })

    const project = CreateProjectSchema.parse({
      name: trimmedName,
      description,
      database,
      dir,
    })
    console.log(project)

    Go.projects.create(project).then(() => {
      refetch()
      closeBtnRef.current?.click()
      toast('Project Created', {
        description: 'Your project has been created.',
      })
    })
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>New Project</DialogTitle>
        <DialogDescription>
          Name your project, choose a database and launch it!
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="BrightSide Portal"
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A portal for the BrightSide team"
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Database</Label>
          <Select
            value={database}
            onValueChange={(db: 'postgres') => setDatabase(db)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Database</SelectLabel>
                <SelectItem value="postgres">Postgres</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={handleSubmit}
          type="submit"
          disabled={!name || !database}
        >
          Save changes
        </Button>
      </DialogFooter>
      <DialogClose className="hidden" ref={closeBtnRef} />
    </DialogContent>
  )
}
