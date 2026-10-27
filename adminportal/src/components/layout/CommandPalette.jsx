import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  Database,
  Droplets,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Settings,
  Users,
  Waves,
  X,
} from 'lucide-react'
import { cn } from '../../utils/format'
import { useData } from '../../context/DataContext'
import { api } from '../../api/client'
import { farmerFromApi } from '../../data/farmers'

const PAGES = [
  { id: 'page-dashboard', label: 'Dashboard', hint: 'Storage, alerts and farmers', to: '/', icon: LayoutDashboard, type: 'Page' },
  { id: 'page-tanks', label: 'Tank & Reservoir', hint: 'Storage, spillways and field readings', to: '/tanks', icon: Droplets, type: 'Page' },
  { id: 'page-rivers', label: 'River Monitoring', hint: 'Gauges and flood thresholds', to: '/rivers', icon: Waves, type: 'Page' },
  { id: 'page-sms', label: 'SMS Gateway', hint: 'Campaigns and delivery reports', to: '/sms', icon: MessageSquareText, type: 'Page' },
  { id: 'page-farmers', label: 'Farmer Portal', hint: 'Registry and water issue schedule', to: '/farmers', icon: Users, type: 'Page' },
  { id: 'page-database', label: 'Database', hint: 'Browse and edit every table', to: '/database', icon: Database, type: 'Page' },
  { id: 'page-settings', label: 'Settings', hint: 'Workspace preferences and notifications', to: '/settings', icon: Settings, type: 'Page' },
]

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const { TANKS, AT_RISK_TANKS, FLOOD_ALERTS, RIVER_STATIONS } = useData()
  const [farmerResults, setFarmerResults] = useState([])

  // Farmers are searched on the server, a moment after typing stops
  useEffect(() => {
    const search = query.trim()
    if (!open || search.length < 2) {
      setFarmerResults([])
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(() => {
      api(`/admin/farmers?limit=4&q=${encodeURIComponent(search)}`)
        .then((result) => !cancelled && setFarmerResults(result.data.map(farmerFromApi)))
        .catch(() => !cancelled && setFarmerResults([]))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    const timer = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  const groups = useMemo(() => {
    const search = query.trim().toLowerCase()
    const matches = (text) => !search || text.toLowerCase().includes(search)

    const pages = PAGES.filter((page) => matches(page.label) || matches(page.hint))
    const tankPool = search ? TANKS : AT_RISK_TANKS.slice(0, 5)
    const tanks = tankPool
      .filter((tank) => matches(tank.name) || matches(tank.district) || matches(tank.division))
      .slice(0, 5)
      .map((tank) => ({
        id: tank.id,
        label: tank.name,
        hint: `${tank.district} · ${tank.percent.toFixed(1)}% storage`,
        to: `/tanks?q=${encodeURIComponent(tank.name)}`,
        icon: Droplets,
        type: 'Reservoir',
        tone: tank.statusMeta.tone,
      }))
    const riverPool = search ? RIVER_STATIONS : FLOOD_ALERTS
    const rivers = riverPool
      .filter((station) => matches(station.name) || matches(station.river))
      .slice(0, 4)
      .map((station) => ({
        id: station.id,
        label: `${station.name} · ${station.river}`,
        hint: `${station.level.toFixed(2)} m · ${station.statusMeta.label}`,
        to: `/rivers?station=${station.id}`,
        icon: Waves,
        type: 'River gauge',
        tone: station.statusMeta.tone,
      }))
    const farmers = search
      ? farmerResults.map((farmer) => ({
          id: farmer.id,
          label: farmer.name,
          hint: `${farmer.district} · ${farmer.crop} · ${farmer.farm_id}`,
          to: `/farmers?q=${encodeURIComponent(farmer.farm_id)}`,
          icon: Users,
          type: 'Farmer',
          tone: farmer.status === 'Active' ? 'success' : 'warning',
        }))
      : []

    return [
      { label: 'Pages', items: pages },
      {
        label: search ? 'Reservoirs' : 'Priority reservoirs',
        items: tanks,
      },
      { label: search ? 'River gauges' : 'Active river alerts', items: rivers },
      { label: 'Farmers', items: farmers },
    ].filter((group) => group.items.length)
  }, [query, farmerResults, TANKS, AT_RISK_TANKS, FLOOD_ALERTS, RIVER_STATIONS])

  const flatItems = useMemo(() => groups.flatMap((group) => group.items), [groups])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!open) return null

  const run = (item) => {
    if (!item) return
    navigate(item.to)
    onClose()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % Math.max(flatItems.length, 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + flatItems.length) % Math.max(flatItems.length, 1))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      run(flatItems[activeIndex])
    }
  }

  let itemIndex = -1

  return createPortal(
    <div
      className="overlay palette-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="command-palette" role="dialog" aria-modal="true" aria-label="Global search">
        <div className="palette-input">
          <Search size={19} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search reservoirs, river gauges, farmers or pages…"
            aria-label="Search"
          />
          <button type="button" onClick={onClose} aria-label="Close search">
            <X size={17} />
          </button>
        </div>

        <div className="palette-body">
          {groups.length === 0 ? (
            <div className="palette-empty">
              <Search size={26} />
              <strong>No matches for “{query}”</strong>
              <span>Try a tank name, river station, district or farmer ID.</span>
            </div>
          ) : (
            groups.map((group) => (
              <div className="palette-group" key={group.label}>
                <span className="palette-label">{group.label}</span>
                {group.items.map((item) => {
                  itemIndex += 1
                  const index = itemIndex
                  const Icon = item.icon
                  const isActive = activeIndex === index
                  return (
                    <button
                      type="button"
                      key={`${group.label}-${item.id}`}
                      className={cn('palette-item', isActive && 'is-active')}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => run(item)}
                    >
                      <span className={cn('palette-item-icon', item.tone && `tone-${item.tone}`)}>
                        <Icon size={16} />
                      </span>
                      <span className="palette-item-copy">
                        <strong>{item.label}</strong>
                        <span>{item.hint}</span>
                      </span>
                      <span className="palette-item-type">{item.type}</span>
                      {isActive && <CornerDownLeft size={14} className="palette-enter" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span>
            <kbd><ArrowUp size={11} /></kbd>
            <kbd><ArrowDown size={11} /></kbd>
            navigate
          </span>
          <span>
            <kbd><CornerDownLeft size={11} /></kbd>
            open
          </span>
          <span>
            <kbd>esc</kbd>
            close
          </span>
          <span className="palette-footer-brand">Yala Maha global search</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
