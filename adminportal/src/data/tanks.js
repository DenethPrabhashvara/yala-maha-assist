import { titleCase } from '../utils/format'

export const ACFT_TO_MCM = 0.00123348

const STATUS_META = {
  critical: {
    key: 'critical',
    label: 'Critical',
    tone: 'critical',
    range: 'Below 10%',
    description: 'Immediate intervention required',
  },
  low: {
    key: 'low',
    label: 'Low',
    tone: 'warning',
    range: '10 – 25%',
    description: 'Restrict releases, monitor daily',
  },
  watch: {
    key: 'watch',
    label: 'Watch',
    tone: 'info',
    range: '25 – 50%',
    description: 'Within seasonal operating range',
  },
  healthy: {
    key: 'healthy',
    label: 'Healthy',
    tone: 'success',
    range: 'Above 50%',
    description: 'Storage at comfortable level',
  },
  unknown: {
    key: 'unknown',
    label: 'No reading',
    tone: 'neutral',
    range: '—',
    description: 'No storage reading has been received yet',
  },
}

export const TANK_STATUS_META = STATUS_META

export const getTankStatus = (percent) => {
  if (percent === null) return 'unknown'
  if (percent < 10) return 'critical'
  if (percent < 25) return 'low'
  if (percent < 50) return 'watch'
  return 'healthy'
}

const normalizeDistrict = (district) => {
  if (!district) return 'Unknown'
  if (district === 'GALLE (MATARA)') return 'Matara'
  return titleCase(district)
}

const num = (value) => (value === null || value === undefined || value === '' ? null : Number(value))

const sum = (items, selector) => items.reduce((total, item) => total + (selector(item) || 0), 0)

const shortDay = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

// rows: GET /admin/data/reservoirs data, daily: its network averages per day
export function buildTanks(rows = [], daily = []) {
  const TANKS = rows
    .map((row) => {
      const percent = num(row.usable_storage_percent)
      const status = getTankStatus(percent)
      return {
        ...row,
        dbId: row.id,
        id: `TNK-${String(row.id).padStart(3, '0')}`,
        name: titleCase(row.name),
        district: normalizeDistrict(row.district),
        division: titleCase(row.division || ''),
        type: titleCase(row.type || ''),
        latitude: num(row.latitude),
        longitude: num(row.longitude),
        percent: percent ?? 0,
        hasReading: percent !== null,
        status,
        statusMeta: STATUS_META[status],
        isSpilling: row.is_spilling === 'Yes',
        rainfall: num(row.rainfall_prev_day_mm),
        capacityAcft: num(row.gross_capacity_acft) ?? 0,
        capacityMcm: (num(row.gross_capacity_acft) ?? 0) * ACFT_TO_MCM,
        storageAcft: num(row.gross_storage_acft) ?? 0,
        farmlandAcres: num(row.farmland_acres) ?? 0,
        waterDepth: num(row.water_depth_ft) ?? 0,
        fullDepth: num(row.full_depth_ft) ?? 0,
        spillRate: num(row.spilling_rate_cusec) ?? 0,
        history: (row.history || []).map((point) => ({
          date: point.date,
          percent: num(point.percent),
          depth: num(point.depth),
          rainfall: num(point.rainfall),
        })),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const reporting = TANKS.filter((tank) => tank.hasReading)
  const withRain = TANKS.filter((tank) => tank.rainfall !== null)
  const byStatus = (status) => TANKS.filter((tank) => tank.status === status)

  const TANK_SUMMARY = {
    total: TANKS.length,
    reporting: reporting.length,
    major: TANKS.filter((tank) => tank.type === 'Major').length,
    medium: TANKS.filter((tank) => tank.type === 'Medium').length,
    spilling: TANKS.filter((tank) => tank.isSpilling).length,
    critical: byStatus('critical').length,
    low: byStatus('low').length,
    watch: byStatus('watch').length,
    healthy: byStatus('healthy').length,
    averageStorage: reporting.length ? sum(reporting, (tank) => tank.percent) / reporting.length : 0,
    totalCapacityAcft: sum(TANKS, (tank) => tank.capacityAcft),
    totalStorageAcft: sum(TANKS, (tank) => tank.storageAcft),
    totalFarmland: sum(TANKS, (tank) => tank.farmlandAcres),
    rainfallAverage: withRain.length ? sum(withRain, (tank) => tank.rainfall) / withRain.length : 0,
    latestReading: reporting.reduce((latest, tank) => (tank.reading_date > latest ? tank.reading_date : latest), ''),
  }
  TANK_SUMMARY.totalCapacityMcm = TANK_SUMMARY.totalCapacityAcft * ACFT_TO_MCM
  TANK_SUMMARY.totalStorageMcm = TANK_SUMMARY.totalStorageAcft * ACFT_TO_MCM

  const DISTRICTS = Object.values(
    reporting.reduce((accumulator, tank) => {
      const entry = (accumulator[tank.district] ||= { district: tank.district, tanks: 0, totalPercent: 0 })
      entry.tanks += 1
      entry.totalPercent += tank.percent
      return accumulator
    }, {}),
  )
    .map((entry) => ({ ...entry, averageStorage: entry.totalPercent / entry.tanks }))
    .sort((a, b) => b.averageStorage - a.averageStorage)

  // Network average per day, with the same day a year ago left out: there is no history that old yet
  const STORAGE_TREND = daily.map((day) => ({
    month: shortDay(day.date),
    date: day.date,
    storage: num(day.storage),
  }))

  const RAINFALL_SERIES = daily.map((day) => ({
    day: shortDay(day.date),
    rainfall: num(day.rainfall) ?? 0,
    spilling: day.spilling,
  }))

  return {
    TANKS,
    TANK_SUMMARY,
    DISTRICT_OPTIONS: [...new Set(TANKS.map((tank) => tank.district))].sort(),
    SPILLING_TANKS: TANKS.filter((tank) => tank.isSpilling).sort((a, b) => b.spillRate - a.spillRate),
    AT_RISK_TANKS: TANKS.filter((tank) => tank.status === 'critical').sort((a, b) => a.percent - b.percent),
    TANK_STATUS_BREAKDOWN: ['healthy', 'watch', 'low', 'critical'].map((key) => ({
      key,
      ...STATUS_META[key],
      value: TANK_SUMMARY[key],
    })),
    DISTRICTS,
    STORAGE_TREND,
    RAINFALL_SERIES,
  }
}
