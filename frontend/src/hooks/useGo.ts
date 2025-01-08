import { useCallback, useEffect, useRef, useState } from 'react'
import { ZodSchema } from 'zod'

export default function useGo<T>(
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
