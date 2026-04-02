import { useQuery } from '@tanstack/react-query'
import {
  Users, Calendar, FileText, UserCheck,
  TrendingUp, DollarSign, Activity, Brain
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import api from '../../api/axiosInstance'
import StatCard from '../../components/ui/StatCard'

const COLORS = ['#00C896', '#0A1628', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/admin')
      return data.analytics
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  const { overview, charts } = data || {}

  // ── Chart data transformations ───────────────────────────────────
  const statusData = charts?.appointmentsByStatus?.map(s => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
  })) || []

  const diagnosisData = charts?.topDiagnoses?.map(d => ({
    name: d._id.length > 22 ? d._id.substring(0, 22) + '…' : d._id,
    count: d.count,
  })) || []

  const appointmentData = charts?.appointmentsByDay?.map(d => ({
    date: d._id.slice(5),
    appointments: d.count,
  })) || []

  // ── Simulated revenue: PKR 500 per completed appointment ─────────
  const revenueThisMonth = (overview?.completedThisMonth || 0) * 500
  const revenueFormatted = revenueThisMonth.toLocaleString('en-PK')

  // ── Predictive: next 7 days forecast from last 7 days average ────
  const last7 = appointmentData.slice(-7)
  const avgPerDay = last7.length
    ? Math.round(last7.reduce((s, d) => s + d.appointments, 0) / last7.length)
    : 0

  const forecastData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      forecast: Math.max(1, avgPerDay + Math.round((Math.random() - 0.5) * 2)),
    }
  })

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Live overview of your clinic's performance</p>
      </div>

      {/* ── Stat Cards Row 1 ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={overview?.totalPatients}
          subtitle={`+${overview?.newPatientsThisMonth} this month`}
          icon={Users}
          trend={overview?.patientGrowth}
        />
        <StatCard
          title="Appointments"
          value={overview?.appointmentsThisMonth}
          subtitle="This month"
          icon={Calendar}
          color="#3b82f6"
        />
        <StatCard
          title="Completion Rate"
          value={`${overview?.completionRate || 0}%`}
          subtitle="Appointments completed"
          icon={UserCheck}
          color="#8b5cf6"
        />
        <StatCard
          title="Total Doctors"
          value={overview?.totalDoctors}
          subtitle={`${overview?.totalReceptionists} receptionists`}
          icon={Activity}
          color="#f59e0b"
        />
      </div>

      {/* ── Stat Cards Row 2 (Revenue + Prescriptions) ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <StatCard
      title="Revenue This Month"
      value={`PKR ${(overview?.revenueThisMonth || 0).toLocaleString()}`}
      subtitle={`PKR ${(overview?.revenueTotal || 0).toLocaleString()} all time`}
      icon={DollarSign}
      color="#00C896"
      />
        <StatCard
          title="Prescriptions"
          value={overview?.totalPrescriptions}
          subtitle="All time"
          icon={FileText}
          color="#ef4444"
        />
        <StatCard
          title="Avg Daily Load"
          value={avgPerDay}
          subtitle="Appointments per day (7d avg)"
          icon={TrendingUp}
          color="#8b5cf6"
        />
      </div>

      {/* ── Charts Row 1 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Appointments area chart */}
        <div className="card xl:col-span-2">
          <h3
            className="font-bold mb-4"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            Appointments — Last 30 Days
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={appointmentData}>
              <defs>
                <linearGradient id="aptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C896" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--border)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--border)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="#00C896"
                strokeWidth={2}
                fill="url(#aptGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#00C896' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie chart */}
        <div className="card">
          <h3
            className="font-bold mb-4"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            By Status
          </h3>
          {statusData.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
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

      {/* ── Charts Row 2 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Top Diagnoses */}
        <div className="card">
          <h3
            className="font-bold mb-4"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            Most Common Diagnoses
          </h3>
          {diagnosisData.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                No diagnosis data yet
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={diagnosisData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--border)" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={140}
                  stroke="var(--border)"
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#00C896" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Predictive Load Forecast */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} style={{ color: 'var(--brand)' }} />
            <h3
              className="font-bold"
              style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
            >
              7-Day Patient Load Forecast
            </h3>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
            Predicted from 7-day rolling average ({avgPerDay} appts/day)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--border)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--border)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="forecast"
                fill="#0A1628"
                radius={[4, 4, 0, 0]}
                opacity={0.75}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Doctor Performance ────────────────────────────────────── */}
      {charts?.doctorPerformance?.length > 0 && (
        <div className="card">
          <h3
            className="font-bold mb-4"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            Doctor Performance
          </h3>
          <div className="space-y-3">
            {charts.doctorPerformance.map((doc, i) => {
              const max = charts.doctorPerformance[0]?.completedAppointments || 1
              const pct = Math.round((doc.completedAppointments / max) * 100)
              return (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className="avatar w-9 h-9 rounded-xl text-xs flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  >
                    {doc.doctorName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                        Dr. {doc.doctorName}
                      </p>
                      <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
                        {doc.completedAppointments} completed
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--surface-3)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {doc.specialization}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}