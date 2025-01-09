import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Items } from '@/hooks/useSelecty'

interface ComboboxProps<T extends string> {
  emptyStr?: string
  placeholder?: string
  value: T
  setValue: (value: T) => void
  initialValue: T
  items: Items<T>
  children?: React.ReactNode
}

export default function Combobox<T extends string>({
  emptyStr,
  value,
  setValue,
  initialValue,
  placeholder,
  items,
  children,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value
            ? (() => {
                const item = items.find((i) => i.value === value)
                return item?.label ?? value
              })()
            : children}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            {emptyStr && <CommandEmpty>{emptyStr}</CommandEmpty>}
            <CommandGroup>
              {items.map(({ value: iValue, label }) => (
                <CommandItem
                  key={iValue}
                  value={iValue}
                  onSelect={() => {
                    setValue(value === iValue ? initialValue : iValue)
                    setOpen(false)
                  }}
                >
                  {label ?? iValue}
                  <Check className={cn('ml-auto', value === iValue ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
