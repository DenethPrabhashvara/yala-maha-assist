import { slugify } from '../utils/format'

// The Irrigation Department's three gauge thresholds: alert, minor flood and major flood
export const RIVER_STATUS = {
  major: {
    key: 'major',
    label: 'Major flood',
    tone: 'critical',
    description: 'Level at or above the major flood level',
  },
  warning: {
    key: 'warning',
    label: 'Minor flood',
    tone: 'warning',
    description: 'Level at or above the minor flood level',
  },
  watch: {
    key: 'watch',
    label: 'Alert',
    tone: 'info',
    description: 'Level at or above the alert level',
  },
  normal: {
    key: 'normal',
    label: 'Normal',
    tone: 'success',
    description: 'Below the alert level',
  },
}

const riverStatus = (level, alert, minor, major) => {
  if (level === null) return 'normal'
  if (major !== null && level >= major) return 'major'
  if (minor !== null && level >= minor) return 'warning'
  if (alert !== null && level >= alert) return 'watch'
  return 'normal'
}

const num = (value) => (value === null || value === undefined ? null : Number(value))

const HOUR = 3600 * 1000

// rows: GET /admin/data/rivers data, topRainfall: the wettest gauge in the last 24 hours
export function buildRivers(rows = [], topRainfall = null) {
  const RIVER_STATIONS = rows
    .map((row) => {
      const level = num(row.water_level)
      const alert = num(row.alert_level)
      const minor = num(row.minor_flood_level)
      const major = num(row.major_flood_level)
      const status = riverStatus(level, alert, minor, major)
      const readingAt = row.reading_at ? new Date(row.reading_at) : null
      const history = (row.history || []).map((point) => {
        const at = new Date(point.at)
        return {
          time: at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          at,
          level: num(point.level),
          warning: alert,
          major,
          rainfall: num(point.rainfall) ?? 0,
        }
      })
      // Change since the reading closest to 3 hours before the latest one
      const before = readingAt
        ? [...history].reverse().find((point) => readingAt - point.at >= 3 * HOUR - 15 * 60 * 1000)
        : null
      const change = level !== null && before?.level !== null && before ? level - before.level : 0
      return {
        id: slugify(`${row.station}-${row.river}`),
        name: row.station,
        river: row.river,
        latitude: num(row.latitude),
        longitude: num(row.longitude),
        level: level ?? 0,
        warning: alert ?? 0,
        minor: minor ?? 0,
        major: major ?? 0,
        rainfall: num(row.rain_fall) ?? 0,
        change: Number(change.toFixed(2)),
        status,
        statusMeta: RIVER_STATUS[status],
        thresholdHeadroom: major !== null && level !== null ? Number((major - level).toFixed(2)) : 0,
        percentOfMajor: major ? ((level ?? 0) / major) * 100 : 0,
        readingAt,
        history,
      }
    })
    .sort((a, b) => a.river.localeCompare(b.river) || a.name.localeCompare(b.name))

  const latest = RIVER_STATIONS.reduce((newest, station) => (station.readingAt > newest ? station.readingAt : newest), null)
  const count = (status) => RIVER_STATIONS.filter((station) => station.status === status).length

  return {
    RIVER_STATIONS,
    RIVER_SUMMARY: {
      total: RIVER_STATIONS.length,
      normal: count('normal'),
      watch: count('watch'),
      warning: count('warning'),
      major: count('major'),
      rainfall: RIVER_STATIONS.length
        ? RIVER_STATIONS.reduce((total, station) => total + station.rainfall, 0) / RIVER_STATIONS.length
        : 0,
      rivers: new Set(RIVER_STATIONS.map((station) => station.river)).size,
      // Gauges whose latest reading is within 3 hours of the newest one
      reporting: latest ? RIVER_STATIONS.filter((station) => latest - station.readingAt <= 3 * HOUR).length : 0,
      updatedAt: latest,
    },
    // Every gauge at or above its alert level, worst first
    FLOOD_ALERTS: RIVER_STATIONS.filter((station) => station.status !== 'normal').sort(
      (a, b) => b.percentOfMajor - a.percentOfMajor,
    ),
    TOP_RAINFALL: topRainfall
      ? {
          station: topRainfall.station,
          river: topRainfall.basin,
          rainfall: num(topRainfall.rain_fall),
          at: topRainfall.creation_date ? new Date(topRainfall.creation_date) : null,
        }
      : null,
  }
}
