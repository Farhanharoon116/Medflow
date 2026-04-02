import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, User, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'

const statusColors = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  'no-show': 'badge-gray',
}

export default function PatientAppointmentsPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: async () => {
      const { data } = await api.get('/appointments', { params: { limit: 50 } })
      return data
    },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">My Appointments</h1>
        <p className="page-subtitle">Your appointment history and upcoming visits</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8" />
        </div>
      ) : data?.appointments?.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Calendar size={32} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-2)' }}>No appointments yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Contact your clinic to book an appointment
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.appointments?.map((apt, i) => (
            <div key={apt._id}
              className="card stagger-item flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <Calendar size={20} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                    Dr. {apt.doctor?.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {apt.doctor?.specialization}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                      <Calendar size={11} />
                      {format(new Date(apt.date), 'dd MMM yyyy')}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                      <Clock size={11} />
                      {apt.timeSlot}
                    </span>
                  </div>
                  
                  {/* Added Fee and Payment Status Snippet Here */}
                  {apt.fee > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                        Fee: PKR {apt.fee?.toLocaleString()}
                      </span>
                      {apt.feePaid ? (
                        <span className="badge-success">Paid</span>
                      ) : (
                        <span className="badge-warning">Payment Pending</span>
                      )}
                    </div>
                  )}

                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={statusColors[apt.status] || 'badge-gray'}>
                  {apt.status}
                </span>
                <span className="badge-gray capitalize">{apt.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}