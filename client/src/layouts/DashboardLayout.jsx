import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, FileText, LogOut,
    Menu, ChevronLeft, Stethoscope, UserCheck, CreditCard, User, Pill, FlaskConical, Building2 } from 'lucide-react'  
import useAuthStore from '../store/authStore'
import OnboardingChecklist from '../components/OnboardingChecklist'

const navItems = {
    admin: [
      { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/dashboard/patients', icon: Users, label: 'Patients' },
      { to: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
      { to: '/dashboard/prescriptions', icon: FileText, label: 'Prescriptions' },
      { to: '/dashboard/staff', icon: UserCheck, label: 'Manage Staff' },
      { to: '/dashboard/subscription', icon: CreditCard, label: 'Subscription' },
      { to: '/dashboard/clinic-profile', icon: Building2, label: 'Clinic Profile' },
    ],
    doctor: [
      { to: '/dashboard/doctor', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/dashboard/patients', icon: Users, label: 'Patients' },
      { to: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
      { to: '/dashboard/prescriptions', icon: FileText, label: 'Prescriptions' },
    ],
    receptionist: [
      { to: '/dashboard/receptionist', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/dashboard/patients', icon: Users, label: 'Patients' },
      { to: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
    ],
    patient: [
      { to: '/dashboard/my-profile', icon: User, label: 'My Profile', end: true },
      { to: '/dashboard/my-appointments', icon: Calendar, label: 'My Appointments' },
      { to: '/dashboard/my-medicines', icon: Pill, label: 'My Medicines' },
      { to: '/dashboard/my-prescriptions', icon: FileText, label: 'My Prescriptions' },
      { to: '/dashboard/my-lab-results', icon: FlaskConical, label: 'Lab Results' },
    ],
  }

const pageTitles = {
  '/dashboard/admin': 'Admin Dashboard',
  '/dashboard/doctor': 'My Dashboard',
  '/dashboard/patients': 'Patients',
  '/dashboard/appointments': 'Appointments',
  '/dashboard/prescriptions': 'Prescriptions',
  '/dashboard/clinic-profile': 'Clinic Profile',
  '/dashboard/my-medicines': 'My Medicines',
  '/dashboard/my-lab-results': 'Lab Results',
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const items = navItems[user?.role] || navItems.patient
  const pageTitle = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'MedFlow'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out relative"
        style={{
          width: collapsed ? '72px' : '240px',
          background: 'var(--navy)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo area */}
        <div className="flex items-center h-16 px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 flex-1 animate-fade-in">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand)' }}>
                <Stethoscope size={15} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-base"
                  style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                  MedFlow
                </span>
                <div className="text-xs font-medium px-1.5 py-0.5 rounded-md inline-block ml-1.5"
                  style={{ background: 'rgba(0,200,150,0.2)', color: 'var(--brand)', fontSize: '9px' }}>
                  {user?.plan?.toUpperCase()}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
            style={{ color: 'rgba(255,255,255,0.4)', marginLeft: collapsed ? 'auto' : '0' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 pt-4 pb-2">
            <div className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              {user?.role}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto">
          {items.map(({ to, icon: IconComponent, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
              }
            >
              <IconComponent size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-2.5 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* User info */}
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="avatar w-8 h-8 rounded-lg text-xs flex-shrink-0"
                style={{ background: 'var(--brand)' }}>
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-xs truncate capitalize"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {user?.clinic?.name || 'MedFlow Clinic'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`nav-item w-full ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Logout' : undefined}
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-6 flex-shrink-0"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
          }}>
          <div>
            <h1 className="text-lg font-bold" style={{
              fontFamily: 'Outfit, sans-serif',
              color: 'var(--text-1)',
              letterSpacing: '-0.02em',
            }}>
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--brand)' }} />
              <span className="text-xs font-medium">System online</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="relative flex-1 overflow-y-auto p-6">
          <Outlet />
          <OnboardingChecklist />
        </main>
      </div>
    </div>
  )
}