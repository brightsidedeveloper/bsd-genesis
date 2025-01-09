import { FormEventHandler, useCallback, useRef } from 'react'
import { ZodSchema } from 'zod'

export default function useDialogForm<T>(onSubmit: (v: T) => boolean, schema: ZodSchema<T>) {
  const closeRef = useRef<HTMLButtonElement>(null)

  const submitRef = useRef(onSubmit)
  submitRef.current = onSubmit

  const handleSubmit = useCallback<FormEventHandler>(
    (e) => {
      e.preventDefault()
      const form = e.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      const values: Record<string, string> = Object.fromEntries(formData.entries()) as Record<string, string>

      const { data, success } = schema.safeParse(values)
      if (!success) return

      const yay = submitRef.current(data)
      if (!yay) return
      form.reset()
      closeRef.current?.click()
    },
    [schema]
  )

  return {
    closeRef,
    handleSubmit,
  }
}
