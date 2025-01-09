import { useState } from 'react'

export default function useSelect<T extends string>(initial: T, { items }: UseSelectOpts<T>) {
  const [value, setValue] = useState(initial)

  return { value, setValue, items }
}

export interface UseSelectOpts<T extends string> {
  items: Items<T>
}

export type Items<T extends string> = {
  label?: string
  value: T
}[]
