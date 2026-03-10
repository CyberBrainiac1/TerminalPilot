import { useEffect } from 'react'
import { useSettingsStore, type SettingsState } from '../stores/settingsStore'

export function useSettings(): SettingsState {
  const store = useSettingsStore()
  useEffect(() => {
    store.loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return store
}
