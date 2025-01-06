import { atom } from 'jotai'

export const connectedAtom = atom(false)
export const disconnectingRef = {
  current: undefined as NodeJS.Timeout | undefined,
}
