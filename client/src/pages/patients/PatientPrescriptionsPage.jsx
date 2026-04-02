import { useQuery } from '@tanstack/react-query'
import { FileText, Download, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import api from '../../api/axiosInstance'

export default function PatientPrescriptionsPage() {
  const [expanded, setExpanded] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['myPrescriptions'],
    queryFn: async () => {
      const { data } = await api.get('/prescriptions', { params: { limit: 50 } })
      return data
    },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">My Prescriptions</h1>
        <p className="page-subtitle">All prescriptions issued by your doctors</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8" />
        </div>
      ) : data?.prescriptions?.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <FileText size={32} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-2)' }}>
            No prescriptions yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.prescriptions?.map((rx) => (
            <div key={rx._id} className="card stagger-item p-0 overflow-hidden">

              {/* Card Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => setExpanded(expanded === rx._id ? null : rx._id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--brand-light)' }}
                  >
                    <FileText size={18} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                      {rx.diagnosis}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      Dr. {rx.doctor?.name} · {format(new Date(rx.createdAt), 'dd MMM yyyy')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {rx.medicines?.length} medicine{rx.medicines?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* PDF — uses backend download endpoint, bypasses Cloudinary 401 */}
                  <a
                    href={`${import.meta.env.VITE_API_URL}/prescriptions/${rx._id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                  >
                    <Download size={13} /> PDF
                  </a>

                  {expanded === rx._id
                    ? <ChevronUp size={16} style={{ color: 'var(--text-3)' }} />
                    : <ChevronDown size={16} style={{ color: 'var(--text-3)' }} />
                  }
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === rx._id && (
                <div
                  className="px-5 pb-5 space-y-4 animate-fade-in"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  {/* Medicines */}
                  <div className="mt-4">
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: 'var(--text-3)' }}
                    >
                      Medicines
                    </p>
                    <div className="space-y-2">
                      {rx.medicines?.map((med, j) => (
                        <div
                          key={j}
                          className="p-3 rounded-xl"
                          style={{ background: 'var(--surface-2)' }}
                        >
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                            {med.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                            {med.dosage} · {med.frequency} · {med.duration}
                          </p>
                          {med.instructions && (
                            <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-3)' }}>
                              {med.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General Instructions */}
                  {rx.instructions && (
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: 'var(--text-3)' }}
                      >
                        Instructions
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                        {rx.instructions}
                      </p>
                    </div>
                  )}

                  {/* Follow Up */}
                  {rx.followUpDate && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--brand-light)' }}
                    >
                      <p className="text-xs font-semibold" style={{ color: 'var(--brand-dark)' }}>
                        Follow-up: {format(new Date(rx.followUpDate), 'dd MMMM yyyy')}
                      </p>
                    </div>
                  )}

                  {/* AI Explanation */}
                  {rx.aiExplanation && (
                    <div
                      className="p-4 rounded-xl space-y-2"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} style={{ color: 'var(--brand)' }} />
                        <p
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: 'var(--brand)' }}
                        >
                          AI Explanation
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        {rx.aiExplanation}
                      </p>
                      {rx.aiExplanationUrdu && (
                        <>
                          <div className="divider" />
                          <p
                            className="text-sm leading-relaxed text-right"
                            dir="rtl"
                            style={{ color: 'var(--text-2)' }}
                          >
                            {rx.aiExplanationUrdu}
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Full download button at bottom */}
                  <a
                    href={`${import.meta.env.VITE_API_URL}/prescriptions/${rx._id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: 'var(--brand-light)',
                      color: 'var(--brand)',
                      border: '1px solid rgba(0,200,150,0.2)',
                    }}
                  >
                    <Download size={15} />
                    Download Full Prescription PDF
                  </a>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  )
}