import Go from '@/Go'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import useDirAndName from './useDirAndName'
import { useAtom } from 'jotai'
import { connectedAtom, disconnectingRef } from '@/context/dbAtoms'

export default function useDB() {
  const { dir } = useDirAndName()
  const [connected, setConnected] = useAtom(connectedAtom)
  const connectingRef = useRef(false)

  useEffect(() => {
    if (connected || connectingRef.current) return
    connectingRef.current = true
    Go.db
      .connect(dir)
      .then(() => {
        toast.success('Connected to database')
        setConnected(true)
      })
      .catch(() => toast.error('Failed to connect to database'))
      .finally(() => {
        connectingRef.current = false
      })
  }, [connected, dir, setConnected])

  useEffect(() => {
    clearTimeout(disconnectingRef.current)
    return () => {
      disconnectingRef.current = setTimeout(() => {
        Go.db
          .disconnect()
          .then(() => {
            toast.success('Disconnected from database')
            setConnected(false)
            connectingRef.current = false
          })
          .catch(() => toast.error('Failed to disconnect from database'))
      })
    }
  }, [setConnected])

  return { connected }
}
