import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'

export default function PrescriptionsPage() {
  const navigate    = useNavigate()
  const { user }    = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const { data } = await api.get('/prescriptions', { params: { limit: 30 } })
      return data
    },
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="page-subtitle">{data?.total ?? 0} total prescriptions</p>
        </div>
        {user?.role === 'doctor' && (
          <button
            onClick={() => navigate('/dashboard/prescriptions/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> New Prescription
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner w-8 h-8" />
          </div>
        ) : data?.prescriptions?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={40} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-2)' }}>
              No prescriptions yet
            </p>
            {user?.role === 'doctor' && (
              <button
                onClick={() => navigate('/dashboard/prescriptions/new')}
                className="btn-primary mt-4"
              >
                Create First Prescription
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Patient</th>
                <th className="table-header">Diagnosis</th>
                <th className="table-header">Doctor</th>
                <th className="table-header">Medicines</th>
                <th className="table-header">Date</th>
                <th className="table-header">PDF</th>
              </tr>
            </thead>
            <tbody>
              {data?.prescriptions?.map((rx) => (
                <tr key={rx._id} className="table-row stagger-item">

                  {/* Patient */}
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="avatar w-8 h-8 rounded-lg text-xs flex-shrink-0"
                        style={{ background: 'var(--navy)', fontSize: '11px' }}
                      >
                        {rx.patient?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                          {rx.patient?.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {rx.patient?.age} yrs · {rx.patient?.gender}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Diagnosis */}
                  <td className="table-cell">
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-2)', maxWidth: '220px' }}
                    >
                      {rx.diagnosis}
                    </p>
                  </td>

                  {/* Doctor */}
                  <td className="table-cell">
                    <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                      Dr. {rx.doctor?.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {rx.doctor?.specialization}
                    </p>
                  </td>

                  {/* Medicines count */}
                  <td className="table-cell">
                    <span className="badge-info">
                      {rx.medicines?.length} medicine{rx.medicines?.length !== 1 ? 's' : ''}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="table-cell">
                    <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                      {format(new Date(rx.createdAt), 'dd MMM yyyy')}
                    </p>
                  </td>

                  {/* PDF download — uses backend endpoint, never 401 */}
                  <td className="table-cell">
                    <a
                      href={`${import.meta.env.VITE_API_URL}/prescriptions/${rx._id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors w-fit"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                    >
                      <Download size={13} /> PDF
                    </a>
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