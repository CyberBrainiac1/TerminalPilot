import React, { useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useSettings } from './hooks/useSettings'
import type { ShellProfile } from './types'

export default function App() {
  const { settings, isLoading, isConfigured } = useSettings()
  const [shellProfiles, setShellProfiles] = useState<ShellProfile[]>([])
  const [profilesLoaded, setProfilesLoaded] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    window.electronAPI.shell
      .getProfiles()
      .then((profiles) => {
        setShellProfiles(profiles)
        setProfilesLoaded(true)
      })
      .catch(() => setProfilesLoaded(true))
  }, [])

  useEffect(() => {
    if (!isLoading && profilesLoaded) {
      setShowWelcome(settings.showWelcomeOnStart && !isConfigured)
    }
  }, [isLoading, profilesLoaded, settings.showWelcomeOnStart, isConfigured])

  if (isLoading || !profilesLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--bg-primary)] text-[var(--text-muted)] text-sm">
        <span className="animate-pulse">Loading TerminalPilot AI...</span>
      </div>
    )
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        shellProfiles={shellProfiles}
        onComplete={() => setShowWelcome(false)}
      />
    )
  }

  return <AppShell />
}
