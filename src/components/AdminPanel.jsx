import { useEffect, useState } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'

const PERMS = [
  { key: 'LOGIN', label: 'Login' },
  { key: 'VIEW_DASHBOARD', label: 'Dashboard' },
  { key: 'VIEW_CUSTOMERS', label: 'View Customers' },
  { key: 'CREATE_CUSTOMER', label: 'Add Customer' },
  { key: 'EDIT_CUSTOMER', label: 'Edit Customer' },
  { key: 'DELETE_CUSTOMER', label: 'Delete Customer' },
  { key: 'CREATE_TRANSACTION', label: 'Add Entry' },
  { key: 'DELETE_TRANSACTION', label: 'Delete Entry' },
  { key: 'EXPORT_PDF', label: 'PDF Export' },
  { key: 'WHATSAPP', label: 'WhatsApp' },
  { key: 'BACKUP', label: 'Backup/Restore' },
]

const defaultUserPerms = () => Object.fromEntries(PERMS.map((p) => [p.key, true]))

function secondaryAuth() {
  const config = {
    apiKey: 'AIzaSyBCrb7MxRFNj_qvGf-HJumbnWFXd3dskno',
    authDomain: 'digital-khatay.firebaseapp.com',
    projectId: 'digital-khatay',
    storageBucket: 'digital-khatay.firebasestorage.app',
    messagingSenderId: '934621027982',
    appId: '1:934621027982:web:82fe766fddd84b6e7833df',
  }
  const app = getApps().find((a) => a.name === 'Secondary') || initializeApp(config, 'Secondary')
  return getAuth(app)
}

const card = {
  background: '#fff',
  borderRadius: 14,
  padding: 18,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  border: '1px solid #e2e8f0',
}
const btn = (bg = '#185FA5') => ({
  padding: '8px 14px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
})
const input = {
  width: '100%',
  padding: 10,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  boxSizing: 'border-box',
}

const ICONS = {
  dashboard: '📊',
  users: '👥',
  create: '➕',
  resets: '🔑',
  logins: '🕐',
  settings: '⚙️',
}

export default function AdminPanel() {
  const { profile, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [logins, setLogins] = useState([])
  const [resets, setResets] = useState([])
  const [settings, setSettings] = useState({
    appName: 'Digital Khata',
    publisherName: '',
    publisherRemarks: '',
    contactWhatsApp: '03099101961',
    resetMessage: '',
    superAdminEmail: profile?.email || '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
  })
  const [createPerms, setCreatePerms] = useState(defaultUserPerms())
  const [logoutAsk, setLogoutAsk] = useState(false)

  const flash = (t, isErr = false) => {
    if (isErr) setErr(t)
    else setMsg(t)
    setTimeout(() => {
      setMsg('')
      setErr('')
    }, 3500)
  }

  const loadAll = async () => {
    setBusy(true)
    try {
      const [uSnap, lSnap, rSnap, sSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'loginHistory'), orderBy('at', 'desc'), limit(50))).catch(() => null),
        getDocs(query(collection(db, 'passwordResetRequests'), orderBy('createdAt', 'desc'), limit(50))).catch(() => null),
        getDoc(doc(db, 'settings', 'app')).catch(() => null),
      ])
      setUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      if (lSnap) setLogins(lSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      if (rSnap) setResets(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      if (sSnap?.exists()) {
        const d = sSnap.data()
        setSettings((s) => ({
          ...s,
          ...d,
          appName: d.appName || d.businessName || s.appName,
          publisherName: d.publisherName || '',
          publisherRemarks: d.publisherRemarks || '',
        }))
      }
    } catch (e) {
      console.error(e)
      flash(e.message || 'Failed to load admin data', true)
    }
    setBusy(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    disabled: users.filter((u) => u.status === 'disabled').length,
    pendingResets: resets.filter((r) => r.status === 'pending').length,
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    )
  })

  const createUser = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const sa = secondaryAuth()
      const cred = await createUserWithEmailAndPassword(sa, createForm.email.trim(), createForm.password)
      const uid = cred.user.uid
      await fbSignOut(sa)
      await setDoc(doc(db, 'users', uid), {
        email: createForm.email.trim().toLowerCase(),
        fullName: createForm.fullName.trim(),
        phone: createForm.phone.trim(),
        businessName: createForm.businessName.trim(),
        role: 'user',
        status: 'active',
        permissions: createPerms,
        createdAt: serverTimestamp(),
        createdBy: profile?.id || 'admin',
        lastLoginAt: null,
      })
      try {
        await setDoc(doc(db, 'business', uid), {
          name: createForm.businessName.trim() || createForm.fullName.trim() || 'My Business',
          phone: createForm.phone.trim(),
          address: '',
          currency: 'PKR',
        })
      } catch (_) {}
      flash('User created successfully')
      setCreateForm({ fullName: '', email: '', password: '', phone: '', businessName: '' })
      setCreatePerms(defaultUserPerms())
      setTab('users')
      await loadAll()
    } catch (e) {
      console.error(e)
      flash(e.code === 'auth/email-already-in-use' ? 'Email already in use' : e.message || 'Create failed', true)
    }
    setBusy(false)
  }

  const toggleStatus = async (u) => {
    const next = u.status === 'active' ? 'disabled' : 'active'
    try {
      await updateDoc(doc(db, 'users', u.id), { status: next })
      flash(`User ${next}`)
      await loadAll()
    } catch (e) {
      flash(e.message, true)
    }
  }

  const saveEdit = async () => {
    if (!editUser) return
    try {
      await updateDoc(doc(db, 'users', editUser.id), {
        fullName: editUser.fullName || '',
        phone: editUser.phone || '',
        businessName: editUser.businessName || '',
        status: editUser.status,
        permissions: editUser.permissions || {},
      })
      flash('User updated')
      setEditUser(null)
      await loadAll()
    } catch (e) {
      flash(e.message, true)
    }
  }

  const deleteUserDoc = async (u) => {
    if (u.role === 'super_admin') {
      flash('Cannot delete super admin', true)
      return
    }
    if (!confirm(`Remove profile for ${u.email}?`)) return
    try {
      await deleteDoc(doc(db, 'users', u.id))
      flash('User profile removed')
      await loadAll()
    } catch (e) {
      flash(e.message, true)
    }
  }

  const resolveReset = async (r, status) => {
    try {
      await updateDoc(doc(db, 'passwordResetRequests', r.id), {
        status,
        resolvedAt: serverTimestamp(),
        resolvedBy: profile?.email || '',
      })
      flash(`Request marked ${status}`)
      await loadAll()
    } catch (e) {
      flash(e.message, true)
    }
  }

  const saveSettings = async () => {
    try {
      await setDoc(
        doc(db, 'settings', 'app'),
        {
          appName: settings.appName || 'Digital Khata',
          businessName: settings.appName || 'Digital Khata',
          publisherName: settings.publisherName || '',
          publisherRemarks: settings.publisherRemarks || '',
          contactWhatsApp: settings.contactWhatsApp || '',
          resetMessage: settings.resetMessage || '',
          superAdminEmail: settings.superAdminEmail || '',
        },
        { merge: true }
      )
      flash('App settings saved')
    } catch (e) {
      flash(e.message, true)
    }
  }

  const tabs = [
    ['dashboard', 'Dashboard'],
    ['users', 'Users'],
    ['create', 'Create User'],
    ['resets', 'Reset Requests'],
    ['logins', 'Login History'],
    ['settings', 'Settings'],
  ]

  const fmtTime = (ts) => {
    if (!ts) return '—'
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts)
      return d.toLocaleString()
    } catch {
      return '—'
    }
  }

  const appTitle = settings.appName || 'Digital Khata'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5fb 0%, #f1f5f9 40%)', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #0f4a85 0%, #185FA5 55%, #2563eb 100%)',
          color: '#fff',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          boxShadow: '0 8px 24px rgba(15,74,133,0.25)',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.18)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          DK
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{appTitle} · Admin</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{profile?.email}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={loadAll} style={btn('#3B82F6')}>
            ↻ Refresh
          </button>
          <button type="button" onClick={() => setLogoutAsk(true)} style={btn('#d93b3a')}>
            Logout
          </button>
        </div>
      </header>

      <nav
        style={{
          display: 'flex',
          gap: 6,
          padding: '12px 16px',
          flexWrap: 'wrap',
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              ...btn(tab === id ? '#185FA5' : '#f1f5f9'),
              color: tab === id ? '#fff' : '#334155',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{ICONS[id]}</span> {label}
            {id === 'resets' && stats.pendingResets > 0 ? ` (${stats.pendingResets})` : ''}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16, width: '100%', flex: 1 }}>
        {(msg || err) && (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              background: err ? '#fef2f2' : '#f0fdf4',
              color: err ? '#d93b3a' : '#2f6b12',
            }}
          >
            {err || msg}
          </div>
        )}

        {tab === 'dashboard' && (
          <div className="anim-fade">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              {[
                ['Total Users', stats.total, '#185FA5', '👥'],
                ['Active', stats.active, '#2f6b12', '✅'],
                ['Disabled', stats.disabled, '#d93b3a', '🚫'],
                ['Pending Resets', stats.pendingResets, '#b45309', '🔑'],
              ].map(([label, val, color, icon]) => (
                <div key={label} style={{ ...card, borderTop: `3px solid ${color}` }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                    {icon} {label}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 4 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ ...card, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>APP</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{appTitle}</div>
              {(settings.publisherName || settings.publisherRemarks) && (
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.45 }}>
                  {settings.publisherName}
                  {settings.publisherName && settings.publisherRemarks ? ' — ' : ''}
                  {settings.publisherRemarks}
                </div>
              )}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 8px' }}>Privacy</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                Admin Panel only manages users. User Khata data stays private.
              </p>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div style={card} className="anim-fade">
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                style={{ ...input, maxWidth: 280 }}
                placeholder="Search name, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="button" style={btn()} onClick={() => setTab('create')}>
                + Create User
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '10px 8px', color: '#64748b', fontSize: 11 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{u.fullName || '—'}</td>
                      <td style={{ padding: '10px 8px' }}>{u.email}</td>
                      <td style={{ padding: '10px 8px' }}>{u.role}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            background: u.status === 'active' ? '#dcfce7' : '#fee2e2',
                            color: u.status === 'active' ? '#166534' : '#991b1b',
                          }}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>{fmtTime(u.lastLoginAt)}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            style={btn('#64748b')}
                            onClick={() =>
                              setEditUser({
                                ...u,
                                permissions: { ...defaultUserPerms(), ...(u.permissions || {}) },
                              })
                            }
                          >
                            Edit
                          </button>
                          {u.role !== 'super_admin' && (
                            <>
                              <button
                                type="button"
                                style={btn(u.status === 'active' ? '#d93b3a' : '#2f6b12')}
                                onClick={() => toggleStatus(u)}
                              >
                                {u.status === 'active' ? 'Disable' : 'Enable'}
                              </button>
                              <button type="button" style={btn('#94a3b8')} onClick={() => deleteUserDoc(u)}>
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                        {busy ? 'Loading…' : 'No users found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'create' && (
          <form onSubmit={createUser} style={{ ...card, maxWidth: 520 }} className="anim-fade">
            <h3 style={{ margin: '0 0 14px' }}>➕ Create User</h3>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
              User login only after create. Share temporary password securely.
            </p>
            {[
              ['fullName', 'Full Name'],
              ['email', 'Email'],
              ['password', 'Temporary Password'],
              ['phone', 'Phone (optional)'],
              ['businessName', 'Shop / Business Name (optional)'],
            ].map(([key, label]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{label}</label>
                <input
                  required={key === 'fullName' || key === 'email' || key === 'password'}
                  type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                  minLength={key === 'password' ? 6 : undefined}
                  style={{ ...input, marginTop: 4 }}
                  value={createForm[key]}
                  onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                />
              </div>
            ))}
            <div style={{ margin: '14px 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
              Permissions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
              {PERMS.map((p) => (
                <label key={p.key} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!!createPerms[p.key]}
                    onChange={(e) => setCreatePerms({ ...createPerms, [p.key]: e.target.checked })}
                  />
                  {p.label}
                </label>
              ))}
            </div>
            <button type="submit" disabled={busy} style={{ ...btn(), width: '100%', padding: 12 }}>
              {busy ? 'Creating…' : 'Create User'}
            </button>
          </form>
        )}

        {tab === 'resets' && (
          <div style={card} className="anim-fade">
            <h3 style={{ margin: '0 0 12px' }}>🔑 Password Reset Requests</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 0 }}>
              Contact user on WhatsApp, then reset password in Firebase Authentication → Users.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    {['Email', 'Status', 'Requested', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '10px 8px', color: '#64748b', fontSize: 11 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resets.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{r.email}</td>
                      <td style={{ padding: '10px 8px' }}>{r.status}</td>
                      <td style={{ padding: '10px 8px' }}>{fmtTime(r.createdAt)}</td>
                      <td style={{ padding: '10px 8px' }}>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" style={btn('#2f6b12')} onClick={() => resolveReset(r, 'resolved')}>
                              Done
                            </button>
                            <button type="button" style={btn('#94a3b8')} onClick={() => resolveReset(r, 'rejected')}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {resets.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                        No requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'logins' && (
          <div style={card} className="anim-fade">
            <h3 style={{ margin: '0 0 12px' }}>🕐 Login History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    {['Email', 'Status', 'Time'].map((h) => (
                      <th key={h} style={{ padding: '10px 8px', color: '#64748b', fontSize: 11 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logins.map((l) => (
                    <tr key={l.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 8px' }}>{l.email || '—'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span
                          style={{
                            color:
                              l.status === 'success'
                                ? '#166534'
                                : l.status === 'logout'
                                  ? '#64748b'
                                  : '#991b1b',
                            fontWeight: 700,
                          }}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>{fmtTime(l.at)}</td>
                    </tr>
                  ))}
                  {logins.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                        No history yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ ...card, maxWidth: 560 }} className="anim-fade">
            <h3 style={{ margin: '0 0 6px' }}>⚙️ App Branding</h3>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
              App name & publisher details (footer on login / app screens).
            </p>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>App Name</label>
              <input
                style={{ ...input, marginTop: 4 }}
                value={settings.appName || ''}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                placeholder="Digital Khata"
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Publisher / Company</label>
              <input
                style={{ ...input, marginTop: 4 }}
                value={settings.publisherName || ''}
                onChange={(e) => setSettings({ ...settings, publisherName: e.target.value })}
                placeholder="Your company name"
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Remarks / Footer text</label>
              <textarea
                rows={3}
                style={{ ...input, marginTop: 4, resize: 'vertical' }}
                value={settings.publisherRemarks || ''}
                onChange={(e) => setSettings({ ...settings, publisherRemarks: e.target.value })}
                placeholder="e.g. Developed by … · Support: 03xx…"
              />
            </div>

            <h3 style={{ margin: '0 0 14px', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>App Settings</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Contact WhatsApp</label>
              <input
                style={{ ...input, marginTop: 4 }}
                value={settings.contactWhatsApp || ''}
                onChange={(e) => setSettings({ ...settings, contactWhatsApp: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Super Admin Email</label>
              <input
                style={{ ...input, marginTop: 4 }}
                value={settings.superAdminEmail || ''}
                onChange={(e) => setSettings({ ...settings, superAdminEmail: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                Forgot-password message
              </label>
              <textarea
                rows={3}
                style={{ ...input, marginTop: 4, resize: 'vertical' }}
                value={settings.resetMessage || ''}
                onChange={(e) => setSettings({ ...settings, resetMessage: e.target.value })}
              />
            </div>
            <button type="button" style={{ ...btn(), width: '100%', padding: 12 }} onClick={saveSettings}>
              Save Settings
            </button>
          </div>
        )}
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '14px 16px 20px',
          fontSize: 12,
          color: '#94a3b8',
          borderTop: '1px solid #e2e8f0',
          background: '#fff',
        }}
      >
        <div style={{ fontWeight: 700, color: '#64748b' }}>{appTitle}</div>
        {(settings.publisherName || settings.publisherRemarks) && (
          <div style={{ marginTop: 4 }}>
            {settings.publisherName}
            {settings.publisherName && settings.publisherRemarks ? ' · ' : ''}
            {settings.publisherRemarks}
          </div>
        )}
      </footer>

      {editUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div style={{ ...card, width: 'min(440px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 12px' }}>Edit User</h3>
            <div style={{ marginBottom: 8, fontSize: 13, color: '#64748b' }}>{editUser.email}</div>
            <input
              style={{ ...input, marginBottom: 8 }}
              placeholder="Full name"
              value={editUser.fullName || ''}
              onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
            />
            <input
              style={{ ...input, marginBottom: 8 }}
              placeholder="Phone"
              value={editUser.phone || ''}
              onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
            />
            <input
              style={{ ...input, marginBottom: 8 }}
              placeholder="Business name"
              value={editUser.businessName || ''}
              onChange={(e) => setEditUser({ ...editUser, businessName: e.target.value })}
            />
            <select
              style={{ ...input, marginBottom: 12 }}
              value={editUser.status || 'active'}
              onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
              disabled={editUser.role === 'super_admin'}
            >
              <option value="active">active</option>
              <option value="disabled">disabled</option>
            </select>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Permissions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {PERMS.map((p) => (
                <label key={p.key} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!!(editUser.permissions && editUser.permissions[p.key])}
                    onChange={(e) =>
                      setEditUser({
                        ...editUser,
                        permissions: { ...editUser.permissions, [p.key]: e.target.checked },
                      })
                    }
                  />
                  {p.label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={{ ...btn(), flex: 1 }} onClick={saveEdit}>
                Save
              </button>
              <button type="button" style={btn('#94a3b8')} onClick={() => setEditUser(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {logoutAsk && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 60,
            padding: 16,
          }}
        >
          <div style={{ ...card, width: 'min(340px, 100%)' }}>
            <h3 style={{ margin: '0 0 8px' }}>Logout?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>Admin panel se logout karein?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={{ ...btn('#d93b3a'), flex: 1 }} onClick={() => logout()}>
                Yes, Logout
              </button>
              <button type="button" style={btn('#94a3b8')} onClick={() => setLogoutAsk(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
