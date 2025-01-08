import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Go from '@/Go'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ZodSchema } from 'zod'

export const Route = createLazyFileRoute('/_layout/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const [solarSystemDir, refetch] = useGo('', () => Go.app.env.get('GENESIS_PATH'))

  const change = () => {
    Go.projects.changeDir().then(refetch)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Genesis Directory</Label>
      <div>
        <Card>
          <CardHeader>
            <span className="flex items-center justify-between">
              <span>{solarSystemDir}</span>
              <Button onClick={change}>Change</Button>
            </span>
          </CardHeader>
        </Card>
      </div>{' '}
    </div>
  )
}

function useGo<T>(
  initialValue: T,
  fn: () => Promise<T>,
  opts?: {
    schema?: ZodSchema<T>
    onSuccess?: (v: T) => void
    onError?: (e: Error) => void
  }
) {
  const [state, setState] = useState(initialValue)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const schemaRef = useRef(opts?.schema)
  schemaRef.current = opts?.schema

  const onSuccessRef = useRef(opts?.onSuccess)
  onSuccessRef.current = opts?.onSuccess

  const onErrorRef = useRef(opts?.onError)
  onErrorRef.current = opts?.onError

  const refetch = useCallback(() => {
    fnRef
      .current()
      .then()
      .then((v) => {
        v = schemaRef.current?.parse(v) ?? v
        setState(v)
        onSuccessRef.current?.(v)
      })
  }, [])
  useEffect(refetch, [refetch])
  return [state, refetch] as const
}
