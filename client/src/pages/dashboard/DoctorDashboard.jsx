import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, Users, FileText, Clock,
  Loader2, CheckCircle, Edit2, Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'
import StatCard from '../../components/ui/StatCard'
import EditAvailabilityModal from '../../components/forms/EditAvailabilityModal'
import {
  PieChart, Pie, Cell, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#00C896', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6']

const STATUS_COLORS = {
  pending:   'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger',
}

const DAYS = [
  { key: 'monday',    short: 'Mon' },
  { key: 'tuesday',   short: 'Tue' },
  { key: 'wednesday', short: 'Wed' },
  { key: 'thursday',  short: 'Thu' },
  { key: 'friday',    short: 'Fri' },
  { key: 'saturday',  short: 'Sat' },
  { key: 'sunday',    short: 'Sun' },
]

export default function DoctorDashboard() {
  const { user, fetchMe }   = useAuthStore()
  const queryClient         = useQueryClient()
  const [showEditAvail, setShowEditAvail] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['doctorAnalytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/doctor')
      return data.analytics
    },
  })

  const { data: vitalsRecent } = useQuery({
    queryKey: ['vitalsRecentCount'],
    queryFn: async () => {
      const { data } = await api.get('/vitals/recent-count')
      return data
    },
  })

  // Get doctor's own full profile with availability
  const { data: myProfile } = useQuery({
    queryKey: ['myDoctorProfile', user?._id],
    queryFn: async () => {
      const { data } = await api.get('/auth/me')
      return data.user
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  const { overview, charts, recentAppointments } = data || {}
  const availability = myProfile?.availability

  const statusData = charts?.appointmentsByStatus?.map(s => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
  })) || []

  // Today's day of week
  const todayKey = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">
          {format(new Date(), 'EEEE, MMMM do yyyy')}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Today's Appointments"
          value={overview?.todayAppointments}
          icon={Calendar}
        />
        <StatCard
          title="This Month"
          value={overview?.monthAppointments}
          icon={Calendar}
          color="#3b82f6"
        />
        <StatCard
          title="Patients Seen"
          value={overview?.totalPatientsSeen}
          icon={Users}
          color="#8b5cf6"
        />
        <StatCard
          title="Prescriptions Written"
          value={overview?.totalPrescriptions}
          icon={FileText}
          color="#f59e0b"
        />
        <StatCard
          title="Recent Vitals Recorded"
          value={vitalsRecent?.count ?? '—'}
          icon={Activity}
          color="#00C896"
          subtitle="Last 7 days"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Today's Schedule */}
        <div className="card xl:col-span-2">
          <h3
            className="font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            <Clock size={16} style={{ color: 'var(--brand)' }} />
            Today's Schedule
          </h3>
          {recentAppointments?.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                No appointments today
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAppointments?.map(apt => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="avatar w-9 h-9 rounded-lg text-sm flex-shrink-0"
                      style={{ background: 'var(--navy)' }}
                    >
                      {apt.patient?.name?.charAt(0)}
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-1)' }}
                      >
                        {apt.patient?.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {apt.timeSlot}
                      </p>
                    </div>
                  </div>
                  <span className={STATUS_COLORS[apt.status] || 'badge-gray'}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointments by status pie */}
        <div className="card">
          <h3
            className="font-bold mb-4"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            Appointments by Status
          </h3>
          {statusData.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── My Weekly Availability ─────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3
              className="font-bold"
              style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
            >
              My Weekly Schedule
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {availability?.slotDurationMinutes || 30} minute slots per appointment
            </p>
          </div>
          <button
            onClick={() => setShowEditAvail(true)}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <Edit2 size={14} /> Edit Schedule
          </button>
        </div>

        {!availability ? (
          <div className="empty-state py-6">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              No schedule set yet.
            </p>
            <button
              onClick={() => setShowEditAvail(true)}
              className="btn-primary mt-3 text-sm"
            >
              Set My Availability
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(({ key, short }) => {
              const day     = availability[key]
              const isToday = key === todayKey
              const avail   = day?.isAvailable

              // Calculate slot count
              let slotCount = 0
              if (avail && day.startTime && day.endTime) {
                const [sh, sm] = day.startTime.split(':').map(Number)
                const [eh, em] = day.endTime.split(':').map(Number)
                const total    = (eh * 60 + em) - (sh * 60 + sm)
                slotCount      = Math.max(0, Math.floor(total / (availability.slotDurationMinutes || 30)))
              }

              return (
                <div
                  key={key}
                  className="flex flex-col items-center p-3 rounded-xl text-center transition-all"
                  style={{
                    background: isToday && avail
                      ? 'var(--navy)'
                      : avail
                      ? 'var(--brand-light)'
                      : 'var(--surface-2)',
                    border: isToday
                      ? `2px solid var(--brand)`
                      : '1px solid var(--border)',
                  }}
                >
                  {/* Day label */}
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{
                      color: isToday && avail
                        ? 'rgba(255,255,255,0.6)'
                        : avail
                        ? 'var(--brand-dark)'
                        : 'var(--text-4)',
                    }}
                  >
                    {short}
                  </p>

                  {/* Status dot */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                    style={{
                      background: avail
                        ? isToday ? 'var(--brand)' : 'rgba(0,200,150,0.2)'
                        : 'var(--surface-3)',
                    }}
                  >
                    {avail ? (
                      <CheckCircle
                        size={14}
                        style={{ color: isToday ? 'white' : 'var(--brand)' }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-4)', fontSize: '16px' }}>–</span>
                    )}
                  </div>

                  {avail ? (
                    <>
                      <p
                        className="text-xs font-medium leading-tight"
                        style={{
                          color: isToday ? 'white' : 'var(--brand-dark)',
                          fontSize: '10px',
                        }}
                      >
                        {day.startTime}
                      </p>
                      <p
                        className="text-xs leading-tight"
                        style={{
                          color: isToday ? 'rgba(255,255,255,0.5)' : 'var(--brand)',
                          fontSize: '10px',
                        }}
                      >
                        {day.endTime}
                      </p>
                      <p
                        className="text-xs mt-1 font-bold"
                        style={{
                          color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--brand)',
                          fontSize: '10px',
                        }}
                      >
                        {slotCount} slots
                      </p>
                    </>
                  ) : (
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-4)', fontSize: '10px' }}
                    >
                      Off
                    </p>
                  )}

                  {isToday && (
                    <span
                      className="text-xs font-bold mt-1 px-1.5 py-0.5 rounded"
                      style={{
                        background: 'var(--brand)',
                        color: 'white',
                        fontSize: '9px',
                      }}
                    >
                      TODAY
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Availability Modal */}
      {showEditAvail && myProfile && (
        <EditAvailabilityModal
          doctor={myProfile}
          onClose={() => setShowEditAvail(false)}
          onSuccess={() => {
            setShowEditAvail(false)
            queryClient.invalidateQueries(['myDoctorProfile'])
            fetchMe()
          }}
        />
      )}
    </div>
  )
}
