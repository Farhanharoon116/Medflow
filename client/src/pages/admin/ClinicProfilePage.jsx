import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'

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

export default function ClinicProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const clinic = user?.clinic

  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      city: '',
      logo: '',
    },
  })

  const formCityOptions = useMemo(() => CITY_OPTIONS, [])

  useEffect(() => {
    if (!clinic) return
    reset({
      name: clinic.name || '',
      address: clinic.address || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      city: clinic.city || '',
      logo: clinic.logo || '',
    })
    setLogoPreviewUrl(clinic.logo || '')
  }, [clinic, reset])

  useEffect(() => {
    // `sendTokens` returns `clinic` as an ID. Ensure we fetch the populated clinic object for this page.
    if (!user) return
    if (clinic && typeof clinic === 'object') return
    fetchMe()
  }, [user, clinic, fetchMe])

  const onUploadLogo = async (file) => {
    if (!file) return
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const { data } = await api.post('/auth/upload-clinic-logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setValue('logo', data.logoUrl || '', { shouldDirty: true })
      setLogoPreviewUrl(data.logoUrl || '')
      toast.success('Logo uploaded!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Logo upload failed.')
    } finally {
      setLogoUploading(false)
    }
  }

  const onSubmit = async (formData) => {
    try {
      await api.patch('/auth/clinic-profile', {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        logo: formData.logo,
      })
      toast.success('Clinic profile updated!')
      await fetchMe()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update clinic profile.')
    }
  }

  if (!clinic) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Clinic Profile</h1>
        <p className="page-subtitle">Update your clinic details to complete onboarding.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">Clinic name *</label>
            <input className="input" {...register('name', { required: 'Clinic name is required' })} />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Address *</label>
            <input
              className="input"
              {...register('address', { required: 'Address is required' })}
              placeholder="Street / Area / Landmark"
            />
            {errors.address && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Phone *</label>
            <input
              className="input"
              {...register('phone', { required: 'Phone is required' })}
              placeholder="e.g. 03001234567"
            />
            {errors.phone && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input className="input" {...register('email')} placeholder="clinic@example.com" />
          </div>

          <div>
            <label className="label">City</label>
            <select className="input" {...register('city')}>
              <option value="">Select city</option>
              {formCityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <label className="label">Logo</label>
                <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                  Upload an image (png/jpg/webp).
                </div>
              </div>
              <div className="flex items-center gap-2">
                {logoUploading ? (
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Uploading...
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Optional
                  </span>
                )}
              </div>
            </div>

            {(logoPreviewUrl || clinic.logo) && (
              <div
                className="rounded-xl border border-[var(--border)] overflow-hidden"
                style={{ background: 'var(--surface-2)' }}
              >
                <img
                  src={logoPreviewUrl || clinic.logo}
                  alt="Clinic logo"
                  style={{ width: '100%', maxHeight: 160, objectFit: 'contain' }}
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
                <Upload size={16} />
                {logoUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading
                  </>
                ) : (
                  'Upload logo'
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onUploadLogo(e.target.files?.[0])}
                />
              </label>
              <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                <span className="mono">Cloudinary</span> URL will be saved on submit.
              </div>
            </div>

            {/* Hidden input so we can submit the logo URL */}
            <input type="hidden" {...register('logo')} />
            {!logoPreviewUrl && !clinic.logo && (
              <div className="text-xs" style={{ color: 'var(--text-3)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <ImageIcon size={16} /> No logo uploaded yet.
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => reset()}>
              Reset
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

