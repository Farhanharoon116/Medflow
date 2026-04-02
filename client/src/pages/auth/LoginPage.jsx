import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Stethoscope, Eye, EyeOff, Loader2, ArrowRight, Shield, Zap, BarChart2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const features = [
  { icon: Shield, label: 'Secure patient records', desc: 'HIPAA-inspired data protection' },
  { icon: Zap, label: 'AI-powered diagnosis', desc: 'Gemini AI symptom analysis' },
  { icon: BarChart2, label: 'Real-time analytics', desc: 'Live clinic performance data' },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await login(data.email, data.password)
      toast.success(`Welcome, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-2)' }}>

      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: 'var(--navy)' }}>

        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'var(--brand)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full opacity-10"
          style={{ background: 'var(--blue)', filter: 'blur(80px)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand)' }}>
              <Stethoscope size={20} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
              MedFlow
            </span>
          </div>

          {/* Hero text */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white leading-[1.15] mb-5"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
              Modern clinic<br />management<br />
              <span style={{ color: 'var(--brand)' }}>built for Pakistan</span>
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Digitize prescriptions, manage patients, and get
              AI-powered insights — all in one secure platform.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-12">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,200,150,0.15)' }}>
                  <Icon size={16} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{label}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[['500+', 'Clinics'], ['200K+', 'Patients'], ['50K+', 'Prescriptions']].map(([v, l]) => (
              <div key={l} className="text-center p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit', color: 'var(--brand)' }}>{v}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--navy)' }}>
              <Stethoscope size={17} className="text-white" />
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: 'Outfit', color: 'var(--navy)' }}>
              MedFlow
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-1"
              style={{ fontFamily: 'Outfit', color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
              Sign in
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Access your clinic management dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="doctor@clinic.com"
                {...register('email', { required: 'Email is required' })} />
              {errors.email && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--red)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-4)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--red)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                : <><span>Sign in to MedFlow</span> <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
              Demo credentials
            </p>
            <div className="space-y-1">
              <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
                admin@medflow.com / password123
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
                doctor@medflow.com / password123
              </p>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-4)' }}>
            Contact your clinic admin for login access
          </p>
        </div>
      </div>
    </div>
  )
}