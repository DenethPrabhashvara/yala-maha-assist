import { NavLink } from 'react-router-dom'
import {
  ChevronRight,
  ChevronsLeft,
  Database,
  Droplets,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
  Waves,
} from 'lucide-react'
import { cn } from '../../utils/format'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'

const navItems = ({ TANK_SUMMARY, FLOOD_ALERTS }) => [
  {
    to: '/',
    label: 'Dashboard',
    hint: 'Storage, alerts and farmers',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/tanks',
    label: 'Tank & Reservoir',
    hint: 'Storage & spillways',
    icon: Droplets,
    count: TANK_SUMMARY.critical,
    tone: 'critical',
  },
  {
    to: '/rivers',
    label: 'River',
    hint: 'Gauges & flood watch',
    icon: Waves,
    count: FLOOD_ALERTS.length,
    tone: 'warning',
  },
  {
    to: '/sms',
    label: 'SMS Gateway',
    hint: 'Alerts & campaigns',
    icon: MessageSquareText,
  },
  {
    to: '/farmers',
    label: 'Farmer Portal',
    hint: 'Registry & water schedule',
    icon: Users,
  },
  {
    to: '/database',
    label: 'Database',
    hint: 'Every table, row by row',
    icon: Database,
  },
]

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }) {
  const data = useData()
  const { admin } = useAuth()
  const { TANK_SUMMARY, SCHEDULE_SUMMARY } = data
  return (
    <aside className={cn('sidebar', collapsed && 'is-collapsed', mobileOpen && 'is-open')}>
      <nav className="sidebar-nav" aria-label="Primary">
        <span className="sidebar-label">Workspace</span>
        {navItems(data).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn('nav-item', isActive && 'active')}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <span className="nav-copy">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              {item.count > 0 && (
                <span className={cn('nav-count', `nav-count-${item.tone}`)}>{item.count}</span>
              )}
              <ChevronRight size={15} className="nav-chevron" />
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-season">
        <div className="season-head">
          <span className="season-icon">
            <ShieldCheck size={16} />
          </span>
          <div>
            <strong>Water issue schedule</strong>
            <span>
              {SCHEDULE_SUMMARY.releasing} of {SCHEDULE_SUMMARY.total} canal sections receiving water
            </span>
          </div>
        </div>
        <div className="season-progress">
          <div className="season-track">
            <span style={{ width: `${Math.round(TANK_SUMMARY.averageStorage)}%` }} />
          </div>
          <div className="season-meta">
            <span>Average reservoir storage</span>
            <strong>{TANK_SUMMARY.averageStorage.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn('nav-item', 'nav-item-subtle', isActive && 'active')}
          onClick={onCloseMobile}
          title={collapsed ? 'Settings' : undefined}
        >
          <span className="nav-icon">
            <Settings size={18} />
          </span>
          <span className="nav-copy">
            <strong>Settings</strong>
            <small>Account, password and theme</small>
          </span>
        </NavLink>
        <div className="sidebar-status">
          <span className="status-dot" />
          <span>Signed in as {admin?.username}</span>
        </div>
      </div>

      <button
        type="button"
        className="sidebar-collapse"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronsLeft size={16} />
      </button>
    </aside>
  )
}
