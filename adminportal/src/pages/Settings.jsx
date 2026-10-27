import { useState } from 'react'
import { Check, Clock3, KeyRound, Moon, ShieldCheck, Sun, UserPlus, UserRound } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { ROLE_LABELS, useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { formatDateTime } from '../utils/format'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const EMPTY_PASSWORD = { current: '', next: '', repeat: '' }
const EMPTY_ADMIN = { full_name: '', username: '', password: '', role: 'officer' }

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { admin, isSuperAdmin } = useAuth()
  const [password, setPassword] = useState(EMPTY_PASSWORD)
  const [savingPassword, setSavingPassword] = useState(false)
  const [newAdmin, setNewAdmin] = useState(EMPTY_ADMIN)
  const [creating, setCreating] = useState(false)

  const changePassword = async (event) => {
    event.preventDefault()
    if (password.next !== password.repeat) {
      toast('The new passwords do not match.', { tone: 'error' })
      return
    }
    setSavingPassword(true)
    try {
      await api('/admin/auth/password', {
        method: 'PATCH',
        body: { current_password: password.current, new_password: password.next },
      })
      setPassword(EMPTY_PASSWORD)
      toast('Your other sessions were signed out.', { title: 'Password changed', tone: 'success' })
    } catch (error) {
      toast(error.message, { title: 'Password not changed', tone: 'error' })
    } finally {
      setSavingPassword(false)
    }
  }

  const createAdmin = async (event) => {
    event.preventDefault()
    setCreating(true)
    try {
      const result = await api('/admin/auth/admins', { method: 'POST', body: newAdmin })
      setNewAdmin(EMPTY_ADMIN)
      toast(`${result.data.full_name} can now sign in as ${result.data.username}.`, {
        title: 'Admin account created',
        tone: 'success',
      })
    } catch (error) {
      toast(error.message, { title: 'Account not created', tone: 'error' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="Workspace preferences"
        title="Settings"
        description="Your account, password and how the portal looks."
      />

      <div className="settings-grid">
        <div className="settings-stack">
          <Card>
            <CardHeader
              icon={UserRound}
              title="Account"
              subtitle="The account you are signed in with"
              badge={
                <span className="settings-verified">
                  <ShieldCheck size={13} />
                  Verified
                </span>
              }
            />
            <div className="settings-profile">
              <Avatar name={admin?.full_name} size="lg" status="online" />
              <div className="settings-profile-copy">
                <strong>{admin?.full_name}</strong>
                <span>{ROLE_LABELS[admin?.role] || admin?.role}</span>
                <small>@{admin?.username}</small>
              </div>
            </div>
            <div className="settings-account-meta">
              <div>
                <span>Last sign-in</span>
                <strong>{formatDateTime(admin?.last_login_at)}</strong>
              </div>
              <div>
                <span>Account created</span>
                <strong>{formatDateTime(admin?.created_at)}</strong>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={theme === 'dark' ? Moon : Sun}
              title="Appearance"
              subtitle="Choose the display theme for this device"
            />
            <div className="theme-options" role="radiogroup" aria-label="Display theme">
              <button
                type="button"
                className={`theme-option${theme === 'light' ? ' is-selected' : ''}`}
                role="radio"
                aria-checked={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                <span className="theme-preview theme-preview-light">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="theme-option-copy">
                  <strong>Light</strong>
                  <small>Bright and clear</small>
                </span>
                {theme === 'light' && <Check size={16} className="theme-check" />}
              </button>
              <button
                type="button"
                className={`theme-option${theme === 'dark' ? ' is-selected' : ''}`}
                role="radio"
                aria-checked={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                <span className="theme-preview theme-preview-dark">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="theme-option-copy">
                  <strong>Dark</strong>
                  <small>Comfortable in low light</small>
                </span>
                {theme === 'dark' && <Check size={16} className="theme-check" />}
              </button>
            </div>
            <div className="settings-inline-note">
              <Clock3 size={14} />
              Theme preference is applied immediately and kept for this device.
            </div>
          </Card>
        </div>

        <div className="settings-stack">
          <Card>
            <CardHeader icon={KeyRound} title="Password" subtitle="10 to 72 characters" />
            <form className="form-grid" style={{ padding: '4px 18px 18px' }} onSubmit={changePassword}>
              <label className="field span-2">
                <span>Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password.current}
                  onChange={(event) => setPassword((current) => ({ ...current, current: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={72}
                  value={password.next}
                  onChange={(event) => setPassword((current) => ({ ...current, next: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Repeat new password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password.repeat}
                  onChange={(event) => setPassword((current) => ({ ...current, repeat: event.target.value }))}
                  required
                />
              </label>
              <div className="span-2" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" icon={Check} type="submit" loading={savingPassword}>
                  Change password
                </Button>
              </div>
            </form>
          </Card>

          {isSuperAdmin && (
            <Card>
              <CardHeader
                icon={UserPlus}
                title="Create an admin account"
                subtitle="Officers can only view. Administrators can also change data."
              />
              <form className="form-grid" style={{ padding: '4px 18px 18px' }} onSubmit={createAdmin}>
                <label className="field">
                  <span>Full name</span>
                  <input
                    value={newAdmin.full_name}
                    onChange={(event) => setNewAdmin((current) => ({ ...current, full_name: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Username</span>
                  <input
                    autoComplete="off"
                    pattern="[A-Za-z0-9_.\-]{3,40}"
                    title="3 to 40 letters, numbers, dots, dashes or underscores"
                    value={newAdmin.username}
                    onChange={(event) => setNewAdmin((current) => ({ ...current, username: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Temporary password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={10}
                    maxLength={72}
                    value={newAdmin.password}
                    onChange={(event) => setNewAdmin((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Role</span>
                  <select
                    value={newAdmin.role}
                    onChange={(event) => setNewAdmin((current) => ({ ...current, role: event.target.value }))}
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="span-2" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" icon={UserPlus} type="submit" loading={creating}>
                    Create account
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="settings-security-note">
            <span className="settings-security-icon">
              <ShieldCheck size={17} />
            </span>
            <div>
              <strong>Changing your password signs out your other sessions</strong>
              <span>Sessions also end after 7 days without use. Farmer accounts can never open this portal.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
