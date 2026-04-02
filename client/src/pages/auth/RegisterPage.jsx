import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  CreditCard,
  Clock3,
} from 'lucide-react'

const CITY_OPTIONS = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Peshawar',
  'Quetta',
  'Other',
]

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/auth/register', {
        clinicName: data.clinicName,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        city: data.city || '',
        password: data.password,
      })

      // Auto-login after registration
      await login(data.email, data.password)
      toast.success('Welcome to MedFlow!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-2)' }}>
      {/* Left — Branding panel */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: 'var(--navy)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'var(--brand)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full opacity-10"
          style={{ background: 'var(--blue)', filter: 'blur(80px)' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand)' }}
            >
              <Stethoscope size={20} className="text-white" />
            </div>
            <span
              className="text-white text-xl font-bold"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}
            >
              MedFlow
            </span>
          </div>

          <div className="mt-auto">
            <h1
              className="text-5xl font-bold text-white leading-[1.15] mb-6"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}
            >
              Start your free clinic
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Modern clinic management built for Pakistan.
            </p>

            <div className="space-y-3 mt-10">
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,200,150,0.15)' }}
                >
                  <ShieldCheck size={18} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Secure</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Protect patient data with role-based access.
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,200,150,0.15)' }}
                >
                  <CreditCard size={18} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">No credit card</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Start free and upgrade anytime.
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,200,150,0.15)' }}
                >
                  <Clock3 size={18} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">2 min setup</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Create your clinic and get started fast.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              No setup fees. No hidden steps.
            </div>
          </div>
        </div>
      </div>

      {/* Right — Registration form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[520px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--navy)' }}
            >
              <Stethoscope size={17} className="text-white" />
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--navy)' }}>
              MedFlow
            </span>
          </div>

          <div className="card p-6">
            <h2
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-1)' }}
            >
              Start your free clinic
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
              Create your clinic account. It takes less than 2 minutes.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Clinic name *</label>
                <input
                  className="input"
                  placeholder="e.g. MedFlow Clinic"
                  {...register('clinicName', { required: 'Clinic name is required' })}
                />
                {errors.clinicName && (
                  <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                    {errors.clinicName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Your full name *</label>
                <input
                  className="input"
                  placeholder="e.g. Ahmed Khan"
                  {...register('name', { required: 'Full name is required' })}
                />
                {errors.name && (
                  <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Email address *</label>
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

              <div>
                <label className="label">
                  Phone number <span style={{ fontWeight: 400, letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. 03001234567"
                  {...register('phone', {
                    required: false,
                    validate: (v) =>
                      !v || /^(?:0\d{10,11})$/.test(v) || 'Enter a valid Pakistani phone (e.g. 03001234567)',
                  })}
                />
                {errors.phone && (
                  <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                    {errors.phone.message}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  We accept local 03xxxxxxxxx format.
                </p>
              </div>

              <div>
                <label className="label">
                  City <span style={{ fontWeight: 400, letterSpacing: 0 }}>(optional)</span>
                </label>
                <select className="input" defaultValue="" {...register('city')}>
                  <option value="">Select city</option>
                  {CITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
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
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <span>Start free</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link
                to="/login"
                className="text-sm flex items-center justify-center gap-1"
                style={{ color: 'var(--text-3)' }}
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

