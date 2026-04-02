import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, UserCheck, Stethoscope, Loader2,
  X, Edit2, Save, Calendar, Clock,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance'
import EditAvailabilityModal from '../../components/forms/EditAvailabilityModal'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

// ── Edit Fee Button ──────────────────────────────────────────────────
function EditFeeButton({ doctor }) {
  const [editing, setEditing] = useState(false)
  const [fee, setFee]         = useState(doctor.consultationFee || 500)
  const [saving, setSaving]   = useState(false)
  const queryClient           = useQueryClient()

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/auth/staff/${doctor._id}/fee`, {
        consultationFee: parseInt(fee),
      })
      toast.success('Fee updated!')
      queryClient.invalidateQueries(['staff'])
      setEditing(false)
    } catch {
      toast.error('Failed to update fee')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
      >
        <Edit2 size={12} /> Edit Fee
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <span
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs"
          style={{ color: 'var(--text-3)' }}
        >
          PKR
        </span>
        <input
          type="number"
          className="input pl-9 w-28 py-1.5 text-sm"
          value={fee}
          onChange={e => setFee(e.target.value)}
          min="0"
          autoFocus
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary py-1.5 px-2.5 text-xs flex items-center gap-1"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        Save
      </button>
      <button onClick={() => setEditing(false)} className="btn-ghost p-1.5">
        <X size={14} />
      </button>
    </div>
  )
}

// ── Availability Summary Pills ────────────────────────────────────────
function AvailabilitySummary({ availability }) {
  if (!availability) return (
    <p className="text-xs" style={{ color: 'var(--text-4)' }}>No schedule set</p>
  )

  const activeDays = DAYS.filter(d => availability[d]?.isAvailable)
  if (activeDays.length === 0) return (
    <p className="text-xs" style={{ color: 'var(--text-4)' }}>No days set</p>
  )

  return (
    <div className="flex flex-wrap gap-1">
      {activeDays.map(d => (
        <span key={d} className="badge-brand" style={{ fontSize: '10px', padding: '2px 6px' }}>
          {d.slice(0, 3).charAt(0).toUpperCase() + d.slice(1, 3)}
        </span>
      ))}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
export default function ManageStaffPage() {
  const [showAddModal,          setShowAddModal]          = useState(false)
  const [editingAvailability,   setEditingAvailability]   = useState(null)
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'doctor' },
  })
  const [loading, setLoading] = useState(false)
  const watchedRole = watch('role')

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data } = await api.get('/auth/staff')
      return data.staff
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/auth/add-staff', data)
      toast.success(`${data.role} account created!`)
      queryClient.invalidateQueries(['staff'])
      setShowAddModal(false)
      reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const doctors       = staff?.filter(s => s.role === 'doctor')       || []
  const receptionists = staff?.filter(s => s.role === 'receptionist') || []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Manage Staff</h1>
          <p className="page-subtitle">
            {doctors.length} doctors · {receptionists.length} receptionists
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8" />
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Doctors ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope size={15} style={{ color: 'var(--brand)' }} />
              <h3
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-3)' }}
              >
                Doctors ({doctors.length})
              </h3>
            </div>

            {doctors.length === 0 ? (
              <div
                className="card flex items-center justify-center h-24"
                style={{ borderStyle: 'dashed' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                  No doctors added yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {doctors.map((doc) => (
                  <div key={doc._id} className="card stagger-item space-y-3">

                    {/* Doctor info */}
                    <div className="flex items-center gap-3">
                      <div
                        className="avatar w-11 h-11 rounded-xl text-sm flex-shrink-0"
                        style={{ background: 'var(--navy)' }}
                      >
                        {doc.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ color: 'var(--text-1)' }}
                        >
                          Dr. {doc.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                          {doc.specialization || 'General Physician'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                          {doc.email}
                        </p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: doc.isActive ? 'var(--brand)' : 'var(--text-4)' }}
                      />
                    </div>

                    {/* Fee */}
                    <div
                      className="flex items-center justify-between pt-3"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                          Consultation Fee
                        </p>
                        <p
                          className="text-base font-bold"
                          style={{ color: 'var(--brand)', fontFamily: 'Outfit' }}
                        >
                          PKR {doc.consultationFee?.toLocaleString() || '500'}
                        </p>
                      </div>
                      <EditFeeButton doctor={doc} />
                    </div>

                    {/* Availability */}
                    <div
                      className="pt-3"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} style={{ color: 'var(--text-3)' }} />
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                            Availability
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingAvailability(doc)}
                          className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"
                          style={{ color: 'var(--brand)' }}
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                      </div>
                      <AvailabilitySummary availability={doc.availability} />
                      {doc.availability?.slotDurationMinutes && (
                        <p className="text-xs mt-1.5 flex items-center gap-1"
                          style={{ color: 'var(--text-4)' }}>
                          <Clock size={10} />
                          {doc.availability.slotDurationMinutes} min slots
                        </p>
                      )}
                    </div>

                    {doc.qualification && (
                      <span className="badge-brand">{doc.qualification}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Receptionists ────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck size={15} style={{ color: '#3b82f6' }} />
              <h3
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-3)' }}
              >
                Receptionists ({receptionists.length})
              </h3>
            </div>

            {receptionists.length === 0 ? (
              <div
                className="card flex items-center justify-center h-24"
                style={{ borderStyle: 'dashed' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                  No receptionists added yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {receptionists.map((rec) => (
                  <div key={rec._id} className="card stagger-item">
                    <div className="flex items-center gap-3">
                      <div
                        className="avatar w-11 h-11 rounded-xl text-sm flex-shrink-0"
                        style={{ background: '#1d4ed8' }}
                      >
                        {rec.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ color: 'var(--text-1)' }}
                        >
                          {rec.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                          {rec.email}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {rec.phone || 'No phone'}
                        </p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: rec.isActive ? 'var(--brand)' : 'var(--text-4)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Staff Modal ───────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-box w-full max-w-md">
            <div
              className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2
                className="font-bold text-lg"
                style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
              >
                Add Staff Member
              </h2>
              <button
                onClick={() => { setShowAddModal(false); reset() }}
                className="btn-ghost p-1.5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label">Role *</label>
                <select className="input" {...register('role', { required: true })}>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>

              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  placeholder="Dr. Sarah Ahmed"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="staff@clinic.com"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>

              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  {...register('password', { required: true, minLength: 8 })}
                />
              </div>

              {watchedRole === 'doctor' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Specialization</label>
                      <input
                        className="input"
                        placeholder="General Physician"
                        {...register('specialization')}
                      />
                    </div>
                    <div>
                      <label className="label">Qualification</label>
                      <input
                        className="input"
                        placeholder="MBBS"
                        {...register('qualification')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Consultation Fee (PKR)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="500"
                      defaultValue={500}
                      {...register('consultationFee')}
                    />
                  </div>

                  <div
                    className="p-3 rounded-xl flex items-start gap-2"
                    style={{ background: 'var(--brand-light)' }}
                  >
                    <Calendar size={14} style={{ color: 'var(--brand)', marginTop: 1 }} />
                    <p className="text-xs" style={{ color: 'var(--brand-dark)' }}>
                      After creating the doctor account, use the{' '}
                      <strong>Edit Availability</strong> button on their card to set
                      their weekly schedule and slot duration.
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  placeholder="03001234567"
                  {...register('phone')}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); reset() }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
                    : 'Create Account'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Availability Modal ───────────────────────────── */}
      {editingAvailability && (
        <EditAvailabilityModal
          doctor={editingAvailability}
          onClose={() => setEditingAvailability(null)}
          onSuccess={() => {
            setEditingAvailability(null)
            queryClient.invalidateQueries(['staff'])
          }}
        />
      )}
    </div>
  )
}
