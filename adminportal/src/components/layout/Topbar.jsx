import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Droplets,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
  Waves,
  CalendarDays,
} from 'lucide-react'
import { cn } from '../../utils/format'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { useData } from '../../context/DataContext'
import { ROLE_LABELS, useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/Button'

const ALERT_ICONS = {
  Reservoir: Droplets,
  River: Waves,
  SMS: MessageSquareText,
  Season: CalendarDays,
}

function useClickOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined
    const handlePointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onOutside()
    }
    document.addEventListener('mousedown', handlePointer)
    return () => document.removeEventListener('mousedown', handlePointer)
  }, [ref, onOutside, active])
}

export function Topbar({ onOpenSearch, onOpenMobile }) {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { toast } = useToast()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { SYSTEM_ALERTS } = useData()
  const { admin, signOut } = useAuth()
  // Alerts are worked out from the readings, so "read" is remembered per alert on this device
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('yalamaha-read-alerts')) || []
    } catch {
      return []
    }
  })
  const notificationsRef = useRef(null)
  const profileRef = useRef(null)

  useClickOutside(notificationsRef, () => setNotificationsOpen(false), notificationsOpen)
  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen)

  const unread = SYSTEM_ALERTS.filter((alert) => !readIds.includes(alert.id)).length

  const markAllRead = () => {
    const ids = SYSTEM_ALERTS.map((alert) => alert.id)
    setReadIds(ids)
    try {
      window.localStorage.setItem('yalamaha-read-alerts', JSON.stringify(ids))
    } catch {
      // Private mode: they stay read until the page reloads
    }
  }

  const handleSignOut = async () => {
    setProfileOpen(false)
    try {
      await signOut()
    } catch {
      toast('Signed out on this device. The server could not be reached to end the session.', { tone: 'warning' })
    }
    navigate('/login', { replace: true })
  }

  const handleAlertClick = (alert) => {
    setNotificationsOpen(false)
    navigate(alert.path)
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <IconButton label="Open navigation" className="mobile-menu" onClick={onOpenMobile}>
          <Menu size={20} />
        </IconButton>
        <NavLink to="/" className="topbar-brand" aria-label="Yala Maha Assist home">
          <span className="brand-mark">
            <Droplets size={18} strokeWidth={2.2} />
          </span>
          <span className="brand-copy">
            <strong>Yala Maha Assist</strong>
            <small></small>
          </span>
        </NavLink>
      </div>

      <button type="button" className="global-search" onClick={onOpenSearch}>
        <Search size={16} />
        <span>Search reservoirs, rivers, farmers…</span>
        <kbd></kbd>
      </button>

      <div className="topbar-actions">
        <IconButton
          label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="theme-toggle"
          onClick={toggleTheme}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>

        <div className="popover-wrap" ref={notificationsRef}>
          <button
            type="button"
            className={cn('icon-btn icon-btn-ghost icon-btn-md notification-trigger', notificationsOpen && 'is-active')}
            aria-label="Notifications"
            onClick={() => {
              setNotificationsOpen((open) => !open)
              setProfileOpen(false)
            }}
          >
            <Bell size={18} />
            {unread > 0 && <span className="notification-badge">{unread}</span>}
          </button>

          {notificationsOpen && (
            <div className="popover notification-popover">
              <div className="popover-head">
                <div>
                  <strong>Notifications</strong>
                  <span>{unread} unread updates</span>
                </div>
                <button
                  type="button"
                  className="text-btn"
                  onClick={markAllRead}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              </div>
              <div className="notification-list">
                {SYSTEM_ALERTS.length === 0 && (
                  <div className="notification-item">
                    <span className="notification-copy">
                      <strong>No alerts</strong>
                      <span>Reservoirs and river gauges are within normal levels.</span>
                    </span>
                  </div>
                )}
                {SYSTEM_ALERTS.slice(0, 5).map((alert) => {
                  const Icon = ALERT_ICONS[alert.category] || AlertTriangle
                  const isUnread = !readIds.includes(alert.id)
                  return (
                    <button
                      type="button"
                      className={cn('notification-item', isUnread && 'is-unread')}
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <span className={cn('notification-icon', `tone-${alert.severity}`)}>
                        <Icon size={16} />
                      </span>
                      <span className="notification-copy">
                        <strong>{alert.title}</strong>
                        <span>{alert.time}</span>
                      </span>
                      {isUnread && <i className="unread-dot" />}
                    </button>
                  )
                })}
              </div>
              <div className="popover-foot">
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    setNotificationsOpen(false)
                    navigate('/')
                  }}
                >
                  View all activity
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="topbar-divider" />

        <div className="popover-wrap" ref={profileRef}>
          <button
            type="button"
            className={cn('profile-trigger', profileOpen && 'is-active')}
            onClick={() => {
              setProfileOpen((open) => !open)
              setNotificationsOpen(false)
            }}
          >
            <Avatar name={admin?.full_name} size="sm" status="online" />
            <span className="profile-copy">
              <strong>{admin?.full_name}</strong>
              <small>{ROLE_LABELS[admin?.role] || admin?.role}</small>
            </span>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {profileOpen && (
            <div className="popover profile-popover">
              <div className="profile-head">
                <Avatar name={admin?.full_name} size="md" />
                <div>
                  <strong>{admin?.full_name}</strong>
                  <span>@{admin?.username}</span>
                </div>
              </div>
              <div className="popover-menu">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/settings')
                  }}
                >
                  <UserRound size={16} />
                  My account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/settings')
                  }}
                >
                  <Settings size={16} />
                  Preferences
                </button>
                <hr />
                <button
                  type="button"
                  className="danger-item"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
