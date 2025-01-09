import { useState } from 'react'
import { UseSelectOpts } from './useSelecty'

export default function useCombobox<T extends string>(initialValue: T, { items }: UseSelectOpts<T>) {
  const [value, setValue] = useState(initialValue)

  return { value, setValue, items, initialValue }
}
