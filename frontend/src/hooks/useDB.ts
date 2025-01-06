import Go from '@/Go'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import useDirAndName from './useDirAndName'

export default function useDB() {
  const { dir } = useDirAndName()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (connected) return
    Go.db
      .connect(dir)
      .then(() => {
        toast.success('Connected to database')
        setConnected(true)
      })
      .catch(() => toast.error('Failed to connect to database'))
  }, [connected, dir])

  useEffect(() => {
    return () => {
      Go.db
        .disconnect()
        .then(() => {
          toast.success('Disconnected from database')
          setConnected(false)
        })
        .catch(() => toast.error('Failed to disconnect from database'))
    }
  }, [])

  return { connected }
}
