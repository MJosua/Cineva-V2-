import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  viewMode: "table",
  setViewMode: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light") // Force light theme
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")
    root.classList.add("light") // Always add light class
  }, [theme])

  const value = {
    theme: "light" as Theme,
    setTheme: (theme: Theme) => {
      // Always keep light theme
      localStorage.setItem(storageKey, "light")
      setTheme("light")
    },
    viewMode,
    setViewMode,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
