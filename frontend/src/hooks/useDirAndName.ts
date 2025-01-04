import { nameToDir } from '@/lib/utils'
import { useParams } from '@tanstack/react-router'
import { useMemo } from 'react'

export default function useDirAndName() {
  const { name } = useParams({ strict: false })
  const dir = useMemo(() => nameToDir(name ?? ''), [name])

  return { name, dir }
}
