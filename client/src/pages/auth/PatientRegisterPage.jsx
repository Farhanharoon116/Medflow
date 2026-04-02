import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Stethoscope, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff, Info } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../api/axiosInstance'

export default function PatientRegisterPage() {
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [clinicName, setClinicName]     = useState('')
  const [checkingClinic, setCheckingClinic] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  // Live clinic code lookup — shows clinic name as user types
  const handleClinicCodeBlur = async (e) => {
    const code = e.target.value.trim()
    if (!code || code.length < 10) return
    setCheckingClinic(true)
    try {
      const { data } = await api.get(`/auth/clinic/${code}`)
      setClinicName(data.clinic?.name || '')
    } catch {
      setClinicName('')
    } finally {
      setCheckingClinic(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Register the patient account
      await api.post('/auth/register-patient', {
        name:       data.name,
        email:      data.email,
        password:   data.password,
        phone:      data.phone,
        age:        data.age,
        gender:     data.gender,
        clinicCode: data.clinicCode,
      })

      // Auto-login after registration
      await login(data.email, data.password)
      toast.success('Account created! Welcome to MedFlow.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--surface-2)' }}
    >
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--navy)' }}
          >
            <Stethoscope size={17} className="text-white" />
          </div>
          <span
            className="font-bold text-xl"
            style={{ fontFamily: 'Outfit', color: 'var(--navy)' }}
          >
            MedFlow
          </span>
        </div>

        <div className="card">
          <h2
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)', letterSpacing: '-0.02em' }}
          >
            Patient Registration
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
            Create your account to view appointments and prescriptions online
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* ── Clinic Code ─────────────────────────────────── */}
            <div>
              <label className="label">Clinic Code *</label>
              <input
                className="input"
                placeholder="Paste the Clinic ID given by your receptionist"
                {...register('clinicCode', { required: 'Clinic code is required' })}
                onBlur={handleClinicCodeBlur}
              />
              {errors.clinicCode && (
                <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                  {errors.clinicCode.message}
                </p>
              )}
              {checkingClinic && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  Checking clinic...
                </p>
              )}
              {clinicName && (
                <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--brand)' }}>
                  ✓ Clinic found: {clinicName}
                </p>
              )}
            </div>

            {/* ── Divider ──────────────────────────────────────── */}
            <div className="divider" />

            {/* ── Full Name ────────────────────────────────────── */}
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                placeholder="Ahmed Khan"
                {...register('name', { required: 'Full name is required' })}
              />
              {errors.name && (
                <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* ── Age + Gender ─────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Age *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="25"
                  min="1"
                  max="120"
                  {...register('age', {
                    required: 'Age is required',
                    min: { value: 1, message: 'Invalid age' },
                    max: { value: 120, message: 'Invalid age' },
                  })}
                />
                {errors.age && (
                  <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                    {errors.age.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Gender *</label>
                <select
                  className="input"
                  {...register('gender', { required: 'Gender is required' })}
                >
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            {/* ── Phone ────────────────────────────────────────── */}
            <div>
              <label className="label">Phone Number</label>
              <input
                className="input"
                placeholder="03001234567"
                {...register('phone')}
              />
            </div>

            {/* ── Divider ──────────────────────────────────────── */}
            <div className="divider" />

            {/* ── Email ────────────────────────────────────────── */}
            <div>
              <label className="label">Email Address *</label>
              <input
                type="email"
                className="input"
                placeholder="you@email.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ── Password ─────────────────────────────────────── */}
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Minimum 8 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-4)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ── Submit ───────────────────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account...</>
              ) : (
                <><span>Create Patient Account</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-sm flex items-center justify-center gap-1"
              style={{ color: 'var(--text-3)' }}
            >
              <ArrowLeft size={14} /> Already have an account? Sign in
            </Link>
          </div>
        </div>

        {/* Clinic code help box */}
        <div
          className="mt-4 p-4 rounded-xl flex items-start gap-3"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
        >
          <Info size={15} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
              How to get your Clinic Code
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
              Visit your clinic and ask the receptionist for the <strong>Clinic ID</strong>.
              It's a long string of letters and numbers. You can also find it on any
              prescription paper from your clinic.
            </p>
            <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-4)' }}>
              Example: 6761abc123def456ghi789
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}