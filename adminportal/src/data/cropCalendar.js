// The Mahaweli water issue schedule (GET /admin/data/schedule), one entry per canal section

const formatShort = (date) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const num = (value) => (value === null || value === undefined ? null : Number(value))

export function buildSchedules(rows = [], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const IRRIGATION_SCHEDULES = rows
    .filter((row) => row.water_start && row.water_end)
    .map((row) => {
      const start = new Date(`${row.water_start}T00:00:00`)
      const end = new Date(`${row.water_end}T00:00:00`)
      const totalDays = Math.max(1, Math.round((end - start) / 86400000))
      const elapsed = Math.round((today - start) / 86400000)
      const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100))
      const status =
        today < start ? 'Scheduled' : today > end ? 'Completed' : progress < 12 ? 'Starting' : 'Releasing'
      const paddyArea = num(row.paddy_target_area) ?? 0
      const otherArea = num(row.other_crops_target_area) ?? 0
      const crops = [
        paddyArea && { name: 'Paddy', duration: row.paddy_target_days, area: paddyArea, percentage: num(row.paddy_area_percentage) },
        otherArea && { name: 'Other crops', duration: row.other_crops_target_days, area: otherArea, percentage: num(row.other_crops_area_percentage) },
      ].filter(Boolean)
      return {
        id: `IRS-${String(row.id).padStart(2, '0')}`,
        no: row.no,
        system: row.section ? `${row.tank_name} · ${row.section}` : row.tank_name,
        scheme: row.tank_name,
        section: row.section,
        start,
        end,
        startLabel: formatShort(start),
        endLabel: formatShort(end),
        durationDays: totalDays,
        extent: num(row.initial_extent_ha) ?? 0,
        totalArea: paddyArea + otherArea,
        paddyArea,
        progress: Number(progress.toFixed(0)),
        status,
        crops,
        primaryCrop: crops.length ? crops.reduce((a, b) => (b.area > a.area ? b : a)).name : '—',
      }
    })
    .sort((a, b) => a.start - b.start || a.system.localeCompare(b.system))

  return {
    IRRIGATION_SCHEDULES,
    SCHEDULE_SUMMARY: {
      total: IRRIGATION_SCHEDULES.length,
      schemes: new Set(IRRIGATION_SCHEDULES.map((item) => item.scheme)).size,
      releasing: IRRIGATION_SCHEDULES.filter((item) => item.status === 'Releasing' || item.status === 'Starting').length,
      scheduled: IRRIGATION_SCHEDULES.filter((item) => item.status === 'Scheduled').length,
      totalArea: IRRIGATION_SCHEDULES.reduce((total, item) => total + item.totalArea, 0),
      paddyArea: IRRIGATION_SCHEDULES.reduce((total, item) => total + item.paddyArea, 0),
    },
  }
}
