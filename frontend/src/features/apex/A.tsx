import Combobox from '@/components/Combobox'
import Selecty from '@/components/Selecty'
import useCombobox from '@/hooks/useCombobox'
import useSelect from '@/hooks/useSelecty'

export default function A() {
  const props = useSelect('1', {
    items: [
      { label: 'One', value: '1' },
      { label: 'Two', value: '2' },
    ],
  })

  const cProps = useCombobox('1', {
    items: [
      { label: 'One', value: '1' },
      { label: 'Two', value: '2' },
    ],
  })

  return (
    <div className="flex flex-col gap-4">
      <Selecty {...props} />
      <Combobox {...cProps}>Woah</Combobox>
    </div>
  )
}
