import { useQuery } from '@tanstack/react-query'
import { User, Phone, Mail, MapPin, Droplets, AlertTriangle, Loader2 } from 'lucide-react'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'

export default function PatientProfilePage() {
  const { user } = useAuthStore()

  const { data: patient, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      // Get patient record linked to this user account
      const { data } = await api.get(`/patients/my-record`)
      return data.patient
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Your medical profile and health information</p>
      </div>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: 'var(--navy)', fontFamily: 'Outfit' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}>
              {user?.name}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Patient Account</p>
          </div>
        </div>

        <div className="divider" />

        <div className="grid grid-cols-2 gap-4 mt-4">
          {[
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Phone, label: 'Phone', value: patient?.phone || user?.phone || '—' },
            { icon: User, label: 'Age', value: patient?.age ? `${patient.age} years` : '—' },
            { icon: User, label: 'Gender', value: patient?.gender || '—' },
            { icon: Droplets, label: 'Blood Group', value: patient?.bloodGroup || 'Unknown' },
            { icon: MapPin, label: 'Address', value: patient?.address || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface-2)' }}>
              <Icon size={15} style={{ color: 'var(--text-3)' }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-3)', fontSize: '10px' }}>{label}</p>
                <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-1)' }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Allergies */}
        {patient?.allergies?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-3)' }}>
              <AlertTriangle size={12} className="inline mr-1" />
              Allergies
            </p>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map(a => (
                <span key={a} className="badge-danger">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Chronic conditions */}
        {patient?.chronicConditions?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-3)' }}>Chronic Conditions</p>
            <div className="flex flex-wrap gap-2">
              {patient.chronicConditions.map(c => (
                <span key={c} className="badge-warning">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}