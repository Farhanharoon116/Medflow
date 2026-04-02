import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Zap, Shield, Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'

const plans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 'PKR 0',
    period: 'forever',
    description: 'Perfect for small clinics getting started',
    features: [
      'Up to 30 patients',
      '4 user roles',
      'Appointment management',
      'Basic prescription system',
      'PDF generation',
      'No AI features',
    ],
    missing: ['AI symptom checker', 'AI prescription explanation', 'Advanced analytics', 'Urdu AI support'],
    color: 'var(--text-2)',
    bg: 'var(--surface-2)',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 'PKR 5,000',
    period: 'per month',
    description: 'For growing clinics that need AI and analytics',
    features: [
      'Unlimited patients',
      'All Free features',
      'AI symptom checker (Gemini)',
      'AI prescription explanation',
      'Urdu explanation mode',
      'Advanced analytics dashboard',
      'Predictive patient load forecast',
      'Priority support',
    ],
    missing: [],
    color: 'var(--brand)',
    bg: 'var(--brand-light)',
    recommended: true,
  },
]

export default function SubscriptionPage() {
  const { user, fetchMe } = useAuthStore()
  const queryClient = useQueryClient()
  const [upgrading, setUpgrading] = useState(false)

  const currentPlan = user?.plan || 'free'

  const upgradePlan = async (planId) => {
    if (planId === currentPlan) return
    setUpgrading(true)
    try {
      await api.patch('/auth/update-plan', { plan: planId })
      toast.success(`Successfully ${planId === 'pro' ? 'upgraded to Pro' : 'downgraded to Free'}!`)
      await fetchMe()
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plan')
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="page-title">Subscription Plans</h1>
        <p className="page-subtitle">
          Current plan: <strong style={{ color: 'var(--brand)' }}>{currentPlan.toUpperCase()}</strong>
        </p>
      </div>

      {/* Current plan banner */}
      <div className="p-4 rounded-2xl flex items-center gap-3"
        style={{ background: 'var(--brand-light)', border: '1px solid rgba(0,200,150,0.2)' }}>
        <Shield size={20} style={{ color: 'var(--brand)' }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--brand-dark)' }}>
            You're on the {currentPlan.toUpperCase()} plan
          </p>
          <p className="text-xs" style={{ color: 'var(--brand-dark)', opacity: 0.7 }}>
            {currentPlan === 'free'
              ? 'Upgrade to Pro to unlock AI features and unlimited patients'
              : 'You have access to all features including AI assistance'}
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plans.map(plan => (
          <div key={plan.id}
            className={`card relative ${plan.recommended ? 'ring-2' : ''}`}
            style={{
              ringColor: plan.recommended ? 'var(--brand)' : undefined,
              ...(plan.recommended ? { outline: '2px solid var(--brand)', outlineOffset: '0px' } : {}),
            }}>
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="badge-brand flex items-center gap-1 shadow-sm">
                  <Sparkles size={11} /> Recommended
                </span>
              </div>
            )}

            <div className="mb-5">
              <h3 className="text-xl font-bold mb-1"
                style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}>
                {plan.name}
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>
                {plan.description}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ fontFamily: 'Outfit', color: plan.color }}>
                  {plan.price}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-3)' }}>/{plan.period}</span>
              </div>
            </div>

            <div className="divider" />

            <div className="space-y-2.5 my-5">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: plan.recommended ? 'var(--brand-light)' : 'var(--surface-3)' }}>
                    <Check size={11} style={{ color: plan.recommended ? 'var(--brand)' : 'var(--text-3)' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-2)' }}>{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => upgradePlan(plan.id)}
              disabled={currentPlan === plan.id || upgrading}
              className={`w-full flex items-center justify-center gap-2 ${
                plan.recommended ? 'btn-primary' : 'btn-secondary'
              }`}
              style={currentPlan === plan.id
                ? { opacity: 0.5, cursor: 'default' }
                : {}
              }
            >
              {upgrading
                ? <Loader2 size={16} className="animate-spin" />
                : currentPlan === plan.id
                  ? 'Current Plan'
                  : plan.id === 'pro' ? <><Zap size={15} /> Upgrade to Pro</> : 'Downgrade'
              }
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-4)' }}>
        This is a simulated subscription system for demonstration purposes.
        No real payment is processed.
      </p>
    </div>
  )
}