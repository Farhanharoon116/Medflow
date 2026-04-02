import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle2, Circle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'
import useAuthStore from '../store/authStore'
import confetti from 'canvas-confetti'

const TOTAL_STEPS = 5

function ProgressBar({ completedCount, totalSteps }) {
  const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
  return (
    <div className="mt-3">
      <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.16)' }}>
        <div
          className="h-2 rounded-full"
          style={{
            width: `${pct}%`,
            background: 'var(--brand)',
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  )
}

export default function OnboardingChecklist() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const clinicId = user?.clinic?._id || user?.clinic

  const [locallyDismissed, setLocallyDismissed] = useState(false)
  const [autoDismissStarted, setAutoDismissStarted] = useState(false)
  const autoDismissStartedRef = useRef(false)
  const celebrateTimerRef = useRef(null)

  const { data: status, isLoading } = useQuery({
    queryKey: ['onboardingStatus'],
    queryFn: async () => {
      const { data } = await api.get('/onboarding/status')
      return data
    },
    enabled: isAdmin,
    refetchInterval: 30000, // 30s
  })

  const isStepsComplete = Boolean(
    status &&
    status.completedCount === status.totalSteps &&
    status.totalSteps === TOTAL_STEPS
  )

  // Visible only when onboarding is not complete AND not dismissed.
  // Backend sets `isComplete` to true if either:
  // - all steps are complete, OR
  // - onboarding is dismissed permanently.
  const shouldShow = isAdmin && status && !locallyDismissed && !status.isComplete

  const dismissMutation = useMutation({
    mutationFn: async () => api.patch('/onboarding/complete'),
    onSuccess: () => {
      setLocallyDismissed(true)
      setAutoDismissStarted(false)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to dismiss onboarding.')
      setAutoDismissStarted(false)
    },
  })

  const steps = useMemo(() => {
    if (!status) return []
    return [
      {
        id: 'doctor',
        done: Boolean(status.hasDoctor),
        label: 'Add your first doctor',
        to: '/dashboard/staff',
      },
      {
        id: 'receptionist',
        done: Boolean(status.hasReceptionist),
        label: 'Add your first receptionist',
        to: '/dashboard/staff',
      },
      {
        id: 'patient',
        done: Boolean(status.hasPatient),
        label: 'Register your first patient',
        to: '/dashboard/patients',
      },
      {
        id: 'appointment',
        done: Boolean(status.hasAppointment),
        label: 'Book your first appointment',
        to: '/dashboard/appointments',
      },
      {
        id: 'clinic',
        done: Boolean(status.hasClinicProfile),
        label: 'Complete your clinic profile (address, phone, logo)',
        to: '/dashboard/clinic-profile',
      },
    ]
  }, [status])

  const celebrateKey = clinicId ? `medflow_onboarding_celebrated_${clinicId}` : null
  const dismissScheduledKey = clinicId
    ? `medflow_onboarding_dismiss_scheduled_${clinicId}`
    : null

  const DISMISS_AFTER_MS = 3000

  useEffect(() => {
    if (!isAdmin || !status) return
    if (!isStepsComplete) return
    if (locallyDismissed) return

    if (autoDismissStartedRef.current) return
    autoDismissStartedRef.current = true

    const now = Date.now()
    const scheduledAtRaw = dismissScheduledKey
      ? window.localStorage.getItem(dismissScheduledKey)
      : null
    const scheduledAt = scheduledAtRaw ? Number(scheduledAtRaw) : null
    const delay =
      typeof scheduledAt === 'number' && !Number.isNaN(scheduledAt)
        ? Math.max(0, DISMISS_AFTER_MS - (now - scheduledAt))
        : DISMISS_AFTER_MS

    if (dismissScheduledKey && (!scheduledAt || Number.isNaN(scheduledAt))) {
      window.localStorage.setItem(dismissScheduledKey, String(now))
    }

    // Celebrate once per clinic (prevents re-fire on refresh).
    const alreadyCelebrated =
      celebrateKey ? window.localStorage.getItem(celebrateKey) : false

    // Flip UI state in the next tick to avoid synchronous setState in effects.
    window.setTimeout(() => setAutoDismissStarted(true), 0)

    if (!alreadyCelebrated) {
      if (celebrateKey) window.localStorage.setItem(celebrateKey, '1')
      confetti({
        particleCount: 220,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#00C896', '#0A1628', '#f59e0b', '#ef4444', '#8b5cf6'],
      })
    }

    celebrateTimerRef.current = window.setTimeout(() => {
      dismissMutation.mutate()
    }, delay)

    return () => {
      if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current)
    }
  }, [isAdmin, status, isStepsComplete, locallyDismissed, celebrateKey, dismissScheduledKey, dismissMutation])

  if (!isAdmin || !status || isLoading) return null
  if (!shouldShow) return null

  return (
    <div className="absolute bottom-6 right-6 z-50" style={{ width: 320 }}>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'white',
          border: '1px solid rgba(226,232,240,1)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ background: 'var(--navy)' }} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 style={{ color: 'white', fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
              Getting started
            </h3>
            <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>
              {status.completedCount}/{status.totalSteps} steps
            </span>
          </div>
          <ProgressBar completedCount={status.completedCount} totalSteps={status.totalSteps} />
        </div>

        <div className="p-3 space-y-2">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.done) return
                navigate(s.to)
              }}
              disabled={s.done || autoDismissStarted || locallyDismissed}
              className="w-full flex items-center gap-2.5 text-left rounded-lg p-2 transition-colors"
              style={{
                background: 'transparent',
                cursor: s.done ? 'default' : 'pointer',
                opacity: s.done ? 0.95 : 1,
              }}
            >
              <span className="flex items-center justify-center" style={{ width: 22, height: 22 }}>
                {s.done ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--brand)' }} />
                ) : (
                  <Circle size={18} style={{ color: 'rgba(148,163,184,1)' }} />
                )}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: s.done ? 'var(--text-2)' : 'var(--text-1)',
                  textDecoration: s.done ? 'line-through' : 'none',
                }}
              >
                {s.label}
              </span>
              {s.done && <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 12 }}>Done</span>}
            </button>
          ))}
        </div>

        <div className="p-3 pt-0">
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={autoDismissStarted || locallyDismissed}
            onClick={() => dismissMutation.mutate()}
            style={{ opacity: autoDismissStarted ? 0.75 : 1 }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

