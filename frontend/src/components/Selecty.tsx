import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Items } from '@/hooks/useSelecty'
import { Dispatch, SetStateAction } from 'react'

export default function Selecty<T extends string>({ value, setValue, items, children }: SelectyProps<T>) {
  return (
    <Select value={value} onValueChange={(v: T) => setValue(v)}>
      <SelectTrigger>
        <SelectValue>{children ?? items.find((i) => i.value === value)?.label ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label ?? value}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export interface SelectyProps<T extends string> {
  value: T
  setValue: Dispatch<SetStateAction<T>>
  items: Items<T>
  children?: React.ReactNode
}
