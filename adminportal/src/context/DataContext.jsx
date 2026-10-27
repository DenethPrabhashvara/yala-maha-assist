import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { buildTanks } from '../data/tanks'
import { buildRivers } from '../data/rivers'
import { buildFarmerStats } from '../data/farmers'
import { buildSchedules } from '../data/cropCalendar'
import { buildSms } from '../data/sms'
import { buildAlerts } from '../data/insights'

const DataContext = createContext(null)

// Each data set the pages share, and where it comes from
const SOURCES = {
  reservoirs: () => api('/admin/data/reservoirs'),
  rivers: () => api('/admin/data/rivers'),
  schedule: () => api('/admin/data/schedule'),
  farmerStats: () => api('/admin/data/farmer-stats'),
  campaigns: () => api('/admin/sms/campaigns'),
}

export function DataProvider({ children }) {
  const [raw, setRaw] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState(null)

  // Reloads the named data sets (all of them by default). A failed one keeps its last data.
  const reload = useCallback(async (names = Object.keys(SOURCES)) => {
    setLoading(true)
    const results = await Promise.allSettled(names.map((name) => SOURCES[name]()))
    const nextRaw = {}
    const nextErrors = {}
    results.forEach((result, index) => {
      const name = names[index]
      if (result.status === 'fulfilled') nextRaw[name] = result.value
      else nextErrors[name] = result.reason?.message || 'Could not load'
    })
    setRaw((current) => ({ ...current, ...nextRaw }))
    setErrors((current) => {
      const merged = { ...current, ...nextErrors }
      for (const name of Object.keys(nextRaw)) delete merged[name]
      return merged
    })
    setLoadedAt(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const data = useMemo(() => {
    const built = {
      ...buildTanks(raw.reservoirs?.data, raw.reservoirs?.daily),
      ...buildRivers(raw.rivers?.data, raw.rivers?.topRainfall),
      ...buildFarmerStats(raw.farmerStats?.data),
      ...buildSchedules(raw.schedule?.data),
      ...buildSms(raw.campaigns?.data),
    }
    return { ...built, SYSTEM_ALERTS: buildAlerts(built) }
  }, [raw])

  const value = useMemo(
    () => ({
      ...data,
      loading,
      loaded: Object.keys(raw).length > 0,
      errors,
      loadedAt,
      reload,
    }),
    [data, loading, raw, errors, loadedAt, reload],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}
