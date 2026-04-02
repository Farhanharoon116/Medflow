import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, Clock, User, Loader2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import api from '../../api/axiosInstance'
import BookAppointmentModal from '../../components/forms/BookAppointmentModal'
import { DollarSign } from 'lucide-react'


const statusColors = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  'no-show': 'badge-gray',
}

export default function AppointmentsPage() {
  const [showModal, setShowModal] = useState(false)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', filterDate, filterStatus],
    queryFn: async () => {
      const { data } = await api.get('/appointments', {
        params: {
          date: filterDate || undefined,
          status: filterStatus || undefined,
          limit: 30,
        },
      })
      return data
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/appointments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
      toast.success('Appointment updated')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const markPaid = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/pay`, { paymentMethod: 'cash' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
      toast.success('Fee marked as paid!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })
  
  const handleMarkPaid = (id) => markPaid.mutate(id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-400 text-sm mt-1">{data?.total ?? 0} total appointments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="date"
          className="input w-auto"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <select
          className="input w-auto"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(filterDate || filterStatus) && (
          <button className="btn-secondary text-sm"
            onClick={() => { setFilterDate(''); setFilterStatus('') }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Appointments List */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary-500" />
          </div>
        ) : data?.appointments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Calendar size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No appointments found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Patient</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Doctor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Date & Time</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Actions</th>
                <th className="table-header">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.appointments?.map(apt => (
                <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{apt.patient?.name}</p>
                    <p className="text-xs text-gray-400">{apt.patient?.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">Dr. {apt.doctor?.name}</p>
                    <p className="text-xs text-gray-400">{apt.doctor?.specialization}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar size={13} className="text-gray-400" />
                      {format(new Date(apt.date), 'dd MMM yyyy')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                      <Clock size={12} /> {apt.timeSlot}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge-gray capitalize">{apt.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={statusColors[apt.status] || 'badge-gray'}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="table-cell">
  <div>
    <p className="text-sm font-semibold"
      style={{ color: 'var(--text-1)', fontFamily: 'Outfit' }}>
      PKR {apt.fee?.toLocaleString() || '—'}
    </p>
    {apt.feePaid ? (
      <span className="badge-success mt-1">Paid</span>
    ) : (
      <span className="badge-warning mt-1">Unpaid</span>
    )}
  </div>
</td>
                  <td className="px-6 py-4">
                    {apt.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus.mutate({ id: apt._id, status: 'confirmed' })}
                          className="text-green-500 hover:text-green-700 transition-colors"
                          title="Confirm">
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: apt._id, status: 'cancelled' })}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Cancel">
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: apt._id, status: 'completed' })}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                        style={{ backgroundColor: '#e6f9f4', color: '#00C896' }}>
                        Complete
                      </button>
                    )}
                    {!apt.feePaid && apt.status !== 'cancelled' && (
  <button
    onClick={() => handleMarkPaid(apt._id)}
    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg mt-1 flex items-center gap-1"
    style={{ background: '#dcfce7', color: '#15803d' }}
  >
    <DollarSign size={12} /> Mark Paid
  </button>
)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <BookAppointmentModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries(['appointments'])
            toast.success('Appointment booked!')
          }}
        />
      )}
    </div>
  )
}