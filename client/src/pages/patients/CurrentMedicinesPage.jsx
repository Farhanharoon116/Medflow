import { useQuery } from '@tanstack/react-query'
import { Pill, Clock, UserRound } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../api/axiosInstance'

export default function CurrentMedicinesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['myMedicines'],
    queryFn: async () => {
      const { data } = await api.get('/patients/my-medicines')
      return data
    },
  })

  const medicines = data?.medicines || []

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">My Medicines</h1>
        <p className="page-subtitle">
          Active medicines from your prescriptions in the last 60 days
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8" />
        </div>
      ) : medicines.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Pill size={32} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-2)' }}>
            No active medicines right now
          </p>
          <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: 'var(--text-3)' }}>
            When your doctor prescribes medicines with a current course, they will appear here with
            progress and reminders.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {medicines.map((med, idx) => {
            const remainingPct =
              med.isOngoing || !med.totalDays
                ? 100
                : Math.min(
                    100,
                    Math.max(0, (med.daysRemaining / med.totalDays) * 100)
                  )

            return (
              <div
                key={`${med.name}-${med.prescriptionDate}-${idx}`}
                className="card stagger-item p-0 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2
                        className="text-lg font-bold leading-tight"
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          color: 'var(--text-1)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {med.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="badge-brand">{med.dosage}</span>
                        {med.isOngoing && (
                          <span
                            className="badge"
                            style={{
                              background: 'var(--brand-light)',
                              color: 'var(--brand-dark)',
                              fontFamily: 'Outfit, sans-serif',
                            }}
                          >
                            Ongoing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
                    <div className="flex items-start gap-2">
                      <Clock size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-3)' }} />
                      <span>
                        <span className="font-medium" style={{ color: 'var(--text-1)' }}>
                          {med.frequency}
                        </span>
                        <span style={{ color: 'var(--text-3)' }}> · </span>
                        <span>{med.duration}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserRound size={16} className="flex-shrink-0" style={{ color: 'var(--text-3)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {med.prescribedBy}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      Prescribed{' '}
                      {format(new Date(med.prescriptionDate), 'dd MMM yyyy')}
                    </p>
                  </div>

                  {med.instructions && (
                    <p
                      className="text-sm mt-3 p-3 rounded-xl"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                    >
                      {med.instructions}
                    </p>
                  )}

                  {!med.isOngoing && med.totalDays > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
                        <span>Course progress</span>
                        <span>
                          {med.daysRemaining} of {med.totalDays} days remaining
                        </span>
                      </div>
                      <div
                        className="h-2.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--surface-3)' }}
                        title={`${med.daysRemaining} days remaining of ${med.totalDays}`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${remainingPct}%`,
                            background: 'var(--brand)',
                            boxShadow: '0 0 12px rgba(0,200,150,0.35)',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {med.isOngoing && (
                    <p className="text-xs mt-4 font-medium" style={{ color: 'var(--brand-dark)' }}>
                      No end date — follow your doctor&apos;s advice for how long to continue.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
