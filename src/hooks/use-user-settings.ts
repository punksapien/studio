import { useState, useEffect } from 'react'

interface NotificationSettings {
  email_notifications_general: boolean
  email_notifications_inquiries: boolean
  email_notifications_listing_updates: boolean
  email_notifications_system: boolean
}

interface SettingsData {
  settings: NotificationSettings | null
  isLoading: boolean
  error: string | null
}

export function useUserSettings(): SettingsData & {
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>
} {
  const [data, setData] = useState<SettingsData>({
    settings: null,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }))

        const response = await fetch('/api/auth/user-settings')
        if (!response.ok) {
          throw new Error('Failed to fetch user settings')
        }

        const settingsData = await response.json()

        setData({
          settings: settingsData.settings,
          isLoading: false,
          error: null
        })

      } catch (error) {
        console.error('Settings fetch error:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load settings'
        }))
      }
    }

    fetchSettings()
  }, [])

  const updateSettings = async (settingsUpdate: Partial<NotificationSettings>): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/user-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsUpdate),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const result = await response.json()

      // Update local state
      setData(prev => ({
        ...prev,
        settings: prev.settings ? {
          ...prev.settings,
          ...result.settings
        } : result.settings
      }))

      return true
    } catch (error) {
      console.error('Settings update error:', error)
      return false
    }
  }

  return {
    ...data,
    updateSettings
  }
}
