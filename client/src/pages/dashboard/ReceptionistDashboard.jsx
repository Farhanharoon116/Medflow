import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Users, Clock, Plus, CheckCircle, RefreshCw, Monitor } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axiosInstance'
import StatCard from '../../components/ui/StatCard'
import useAuthStore from '../../store/authStore'

const statusColors = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  'no-show': 'badge-gray',
}

export default function ReceptionistDashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)

  const { data: todayApts, isLoading: loadingApts } = useQuery({
    queryKey: ['todayAppointments', today],
    queryFn: async () => {
      const { data } = await api.get('/appointments', {
        params: { date: today, limit: 50 },
      })
      return data
    },
    // Refresh every 60 seconds automatically
    refetchInterval: 60000,
  })

  // Separate query for total patient count — no limit trick
  const { data: patientStats } = useQuery({
    queryKey: ['patientStats'],
    queryFn: async () => {
      const { data } = await api.get('/patients', { params: { limit: 1, page: 1 } })
      // total comes from the API regardless of limit
      return { total: data.total }
    },
    refetchInterval: 30000,
  })

  const pending   = todayApts?.appointments?.filter(a => a.status === 'pending').length   || 0
  const confirmed = todayApts?.appointments?.filter(a => a.status === 'confirmed').length || 0
  const completed = todayApts?.appointments?.filter(a => a.status === 'completed').length || 0

  // Manual refresh button
  const handleRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Reception Desk</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const cid = user?.clinic?._id ?? user?.clinic
              if (!cid) return
              window.open(`${window.location.origin}/queue?clinicId=${cid}`, '_blank', 'noopener,noreferrer')
            }}
            className="btn-secondary flex items-center gap-2"
            title="Open waiting room display in a new tab"
          >
            <Monitor size={16} />
            Queue Display
          </button>
          {/* Manual refresh */}
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
            title="Refresh data"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/dashboard/patients')}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus size={16} /> New Patient
          </button>
          <button
            onClick={() => navigate('/dashboard/appointments')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Total"
          value={todayApts?.total ?? 0}
          icon={Calendar}
          subtitle="Appointments today"
        />
        <StatCard
          title="Pending"
          value={pending}
          icon={Clock}
          color="#f59e0b"
          subtitle="Awaiting confirmation"
        />
        <StatCard
          title="Confirmed"
          value={confirmed}
          icon={CheckCircle}
          color="#3b82f6"
          subtitle="Ready to see doctor"
        />
        <StatCard
          title="Total Patients"
          value={patientStats?.total ?? '...'}
          icon={Users}
          color="#8b5cf6"
          subtitle="Registered in clinic"
        />
      </div>

      {/* Today's schedule */}
      <div className="card p-0 overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h3 className="font-bold" style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}>
            Today's Schedule
          </h3>
          <span className="badge-brand">{format(new Date(), 'dd MMM yyyy')}</span>
        </div>

        {loadingApts ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner w-8 h-8" />
          </div>
        ) : todayApts?.appointments?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Calendar size={28} />
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>
              No appointments today
            </p>
            <button
              onClick={() => navigate('/dashboard/appointments')}
              className="btn-primary mt-4 text-sm"
            >
              Book First Appointment
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Time</th>
                <th className="table-header">Patient</th>
                <th className="table-header">Doctor</th>
                <th className="table-header">Type</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayApts?.appointments?.map((apt, i) => (
                <tr key={apt._id} className="table-row stagger-item">
                  <td className="table-cell">
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {apt.timeSlot?.split(' - ')[0]}
                    </p>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="avatar w-7 h-7 rounded-lg flex-shrink-0"
                        style={{ background: 'var(--navy)', fontSize: '11px' }}
                      >
                        {apt.patient?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                          {apt.patient?.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {apt.patient?.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                      Dr. {apt.doctor?.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {apt.doctor?.specialization}
                    </p>
                  </td>
                  <td className="table-cell">
                    <span className="badge-gray capitalize">{apt.type}</span>
                  </td>
                  <td className="table-cell">
                    <span className={statusColors[apt.status] || 'badge-gray'}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}