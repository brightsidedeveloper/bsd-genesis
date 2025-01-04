import { createContext } from 'react'

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export type Theme = 'dark' | 'light' | 'system'
