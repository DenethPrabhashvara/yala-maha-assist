import { formatDateTime } from '../utils/format'

const list = (items, count = 3) => {
  const names = items.slice(0, count).map((item) => item.name)
  const more = items.length - names.length
  return more > 0 ? `${names.join(', ')} and ${more} more` : names.join(', ')
}

// Alerts worked out from the latest readings; nothing here is stored
export function buildAlerts({ AT_RISK_TANKS, SPILLING_TANKS, TANK_SUMMARY, FLOOD_ALERTS, SMS_SUMMARY, SCHEDULE_SUMMARY }) {
  const majors = FLOOD_ALERTS.filter((station) => station.status === 'major')
  const minors = FLOOD_ALERTS.filter((station) => station.status === 'warning')
  const alertLevel = FLOOD_ALERTS.filter((station) => station.status === 'watch')
  const tankTime = TANK_SUMMARY.latestReading ? `Readings of ${TANK_SUMMARY.latestReading}` : 'No reading yet'

  const alerts = [
    ...majors.map((station) => ({
      id: `flood-${station.id}`,
      severity: 'critical',
      title: `Major flood level at ${station.name}`,
      detail: `${station.river} is at ${station.level.toFixed(2)} m, ${(station.level - station.major).toFixed(2)} m above its major flood level.`,
      time: formatDateTime(station.readingAt),
      path: `/rivers?station=${station.id}`,
      category: 'River',
    })),
    AT_RISK_TANKS.length > 0 && {
      id: 'tanks-critical',
      severity: 'critical',
      title: `${AT_RISK_TANKS.length} reservoir${AT_RISK_TANKS.length > 1 ? 's' : ''} below 10% storage`,
      detail: `${list(AT_RISK_TANKS)} need review.`,
      time: tankTime,
      path: '/tanks',
      category: 'Reservoir',
    },
    minors.length > 0 && {
      id: 'flood-minor',
      severity: 'warning',
      title: `Minor flood level at ${list(minors, 2)}`,
      detail: `${minors.length} gauge${minors.length > 1 ? 's are' : ' is'} above the minor flood level.`,
      time: formatDateTime(minors[0].readingAt),
      path: `/rivers?station=${minors[0].id}`,
      category: 'River',
    },
    alertLevel.length > 0 && {
      id: 'flood-alert',
      severity: 'info',
      title: `${alertLevel.length} gauge${alertLevel.length > 1 ? 's' : ''} at alert level`,
      detail: `${list(alertLevel)} are above their alert level.`,
      time: formatDateTime(alertLevel[0].readingAt),
      path: '/rivers',
      category: 'River',
    },
    SPILLING_TANKS.length > 0 && {
      id: 'tanks-spilling',
      severity: 'info',
      title: `${SPILLING_TANKS.length} reservoir${SPILLING_TANKS.length > 1 ? 's are' : ' is'} spilling`,
      detail: `Spillway discharge at ${list(SPILLING_TANKS)}.`,
      time: tankTime,
      path: '/tanks',
      category: 'Reservoir',
    },
    SMS_SUMMARY.failedMonth > 0 && {
      id: 'sms-failed',
      severity: 'warning',
      title: `${SMS_SUMMARY.failedMonth} SMS failed this month`,
      detail: 'Some farmer phone numbers could not be reached. See the campaign history.',
      time: formatDateTime(SMS_SUMMARY.lastSent),
      path: '/sms',
      category: 'SMS',
    },
    SCHEDULE_SUMMARY.releasing > 0 && {
      id: 'season',
      severity: 'success',
      title: `Water is being released to ${SCHEDULE_SUMMARY.releasing} canal sections`,
      detail: `${SCHEDULE_SUMMARY.scheduled} more start later in the season.`,
      time: 'Water issue schedule',
      path: '/farmers?tab=calendar',
      category: 'Season',
    },
  ].filter(Boolean)

  return alerts
}
