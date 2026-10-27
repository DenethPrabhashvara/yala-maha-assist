import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AlertTriangle, Droplets, RefreshCw } from 'lucide-react'
import { cn, formatDateTime } from '../../utils/format'
import { useData } from '../../context/DataContext'
import { LoadingScreen } from '../ui/LoadingScreen'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'

export function AppLayout() {
  const location = useLocation()
  const contentRef = useRef(null)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('yalamaha-sidebar') === 'collapsed'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { loaded, loading, errors, loadedAt, reload } = useData()
  const failed = Object.keys(errors)

  useEffect(() => {
    setMobileOpen(false)
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    window.localStorage.setItem('yalamaha-sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('app-shell', collapsed && 'sidebar-collapsed')}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Topbar onOpenSearch={() => setPaletteOpen(true)} onOpenMobile={() => setMobileOpen(true)} />

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <button
        type="button"
        className={cn('sidebar-scrim', mobileOpen && 'is-visible')}
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
      />

      <div className="app-main">
        <main className="app-content" id="main-content" ref={contentRef}>
          {failed.length > 0 && (
            <div className="load-error" role="alert">
              <AlertTriangle size={16} />
              <span>
                Could not load {failed.join(', ')}: {errors[failed[0]]}
              </span>
              <button type="button" className="text-btn" onClick={() => reload(failed)} disabled={loading}>
                <RefreshCw size={13} className={loading ? 'spin' : undefined} />
                Try again
              </button>
            </div>
          )}
          {loaded ? (
            <Outlet context={{ openSearch: () => setPaletteOpen(true) }} />
          ) : (
            <LoadingScreen label="Loading reservoirs, rivers and farmers…" />
          )}

          <footer className="app-footer">
            <span>
              <span className="footer-mark">
                <Droplets size={13} />
              </span>
              Yala Maha Assist
            </span>
            <span className="app-footer-meta">
              <RefreshCw size={13} />
              {loadedAt ? `Loaded ${formatDateTime(loadedAt)}` : 'Loading…'}
            </span>
          </footer>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
