import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { X, Loader2, Calendar, Clock, AlertCircle } from 'lucide-react'
import api from '../../api/axiosInstance'
import toast from 'react-hot-toast'

export default function BookAppointmentModal({ onClose, onSuccess }) {
  const [loading,         setLoading]         = useState(false)
  const [selectedDoctor,  setSelectedDoctor]  = useState(null)
  const [selectedDate,    setSelectedDate]    = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm()

  const watchedDoctorId = watch('doctorId')
  const watchedDate     = watch('date')

  // Fetch patients
  const { data: patientsData } = useQuery({
    queryKey: ['patientsAll'],
    queryFn: async () => {
      const { data } = await api.get('/patients', { params: { limit: 200 } })
      return data.patients
    },
  })

  // Fetch doctors with availability
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data } = await api.get('/auth/doctors')
      return data.doctors
    },
  })

  // Fetch available slots when both doctor and date are selected
  const {
    data: slotsData,
    isLoading: loadingSlots,
    isFetching: fetchingSlots,
  } = useQuery({
    queryKey: ['availableSlots', watchedDoctorId, watchedDate],
    queryFn: async () => {
      if (!watchedDoctorId || !watchedDate) return null
      const { data } = await api.get('/appointments/available-slots', {
        params: { doctorId: watchedDoctorId, date: watchedDate },
      })
      return data
    },
    enabled: !!(watchedDoctorId && watchedDate),
  })

  // When doctor changes, update selectedDoctor state
  const handleDoctorChange = (e) => {
    const doc = doctorsData?.find(d => d._id === e.target.value)
    setSelectedDoctor(doc || null)
    setValue('doctorId', e.target.value)
    setValue('timeSlot', '') // reset time slot
  }

  // Check if a date is available for the selected doctor
  const isDateDisabled = (dateStr) => {
    if (!selectedDoctor?.availability) return false
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const dayOfWeek = dayNames[new Date(dateStr).getDay()]
    return !selectedDoctor.availability[dayOfWeek]?.isAvailable
  }

  const onSubmit = async (data) => {
    if (!data.timeSlot) {
      toast.error('Please select a time slot')
      return
    }
    setLoading(true)
    try {
      await api.post('/appointments', data)
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  // Get today's date string for min date
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="modal-overlay">
      <div className="modal-box w-full max-w-md">

        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            className="font-bold text-lg"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            Book Appointment
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

          {/* Patient */}
          <div>
            <label className="label">Patient *</label>
            <select
              className="input"
              {...register('patientId', { required: 'Patient is required' })}
            >
              <option value="">Select patient...</option>
              {patientsData?.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.phone}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                {errors.patientId.message}
              </p>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label className="label">Doctor *</label>
            <select
              className="input"
              {...register('doctorId', { required: 'Doctor is required' })}
              onChange={handleDoctorChange}
            >
              <option value="">Select doctor...</option>
              {doctorsData?.map(d => (
                <option key={d._id} value={d._id}>
                  Dr. {d.name} — {d.specialization || 'General Physician'}
                </option>
              ))}
            </select>
            {errors.doctorId && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                {errors.doctorId.message}
              </p>
            )}
          </div>

          {/* Doctor availability summary */}
          {selectedDoctor?.availability && (
            <div
              className="p-3 rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-3)' }}
              >
                Dr. {selectedDoctor.name}'s Available Days
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                  const avail = selectedDoctor.availability[day]
                  return (
                    <div
                      key={day}
                      className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{
                        background: avail?.isAvailable ? 'var(--brand-light)' : 'var(--surface-3)',
                        color: avail?.isAvailable ? 'var(--brand-dark)' : 'var(--text-4)',
                      }}
                    >
                      {day.slice(0,3).charAt(0).toUpperCase() + day.slice(1,3)}
                      {avail?.isAvailable && (
                        <span className="ml-1 opacity-70">
                          {avail.startTime}–{avail.endTime}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                <Clock size={10} className="inline mr-1" />
                {selectedDoctor.availability.slotDurationMinutes || 30} minute slots ·
                Fee: PKR {selectedDoctor.consultationFee?.toLocaleString() || '500'}
              </p>
            </div>
          )}

          {/* Date + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                className="input"
                min={today}
                {...register('date', { required: 'Date is required' })}
                onChange={(e) => {
                  setValue('date', e.target.value)
                  setValue('timeSlot', '') // reset slot when date changes
                  setSelectedDate(e.target.value)

                  // Warn if date is unavailable
                  if (selectedDoctor && isDateDisabled(e.target.value)) {
                    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
                    const day = dayNames[new Date(e.target.value).getDay()]
                    toast.error(`Dr. ${selectedDoctor.name} is not available on ${day}s`)
                  }
                }}
              />
              {errors.date && (
                <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" {...register('type')}>
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="checkup">Checkup</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Time Slot — dynamic from API */}
          <div>
            <label className="label">Time Slot *</label>

            {!watchedDoctorId || !watchedDate ? (
              <div
                className="input flex items-center gap-2"
                style={{ color: 'var(--text-4)', cursor: 'default' }}
              >
                <Clock size={14} />
                <span className="text-sm">Select doctor and date first</span>
              </div>
            ) : loadingSlots || fetchingSlots ? (
              <div
                className="input flex items-center gap-2"
                style={{ color: 'var(--text-3)' }}
              >
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Loading available slots...</span>
              </div>
            ) : slotsData?.available === false ? (
              <div>
                <div
                  className="input flex items-center gap-2"
                  style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                >
                  <AlertCircle size={14} />
                  <span className="text-sm">{slotsData.message}</span>
                </div>
              </div>
            ) : slotsData?.slots?.length === 0 ? (
              <div
                className="input flex items-center gap-2"
                style={{ borderColor: '#f59e0b', color: '#b45309' }}
              >
                <AlertCircle size={14} />
                <span className="text-sm">
                  All slots booked for this date. Please choose another day.
                </span>
              </div>
            ) : (
              <>
                <select
                  className="input"
                  {...register('timeSlot', { required: 'Time slot is required' })}
                >
                  <option value="">
                    Select from {slotsData?.slots?.length} available slots...
                  </option>
                  {slotsData?.slots?.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  {slotsData?.bookedCount} of {slotsData?.totalSlots} slots booked today ·
                  Working hours: {slotsData?.workingHours}
                </p>
              </>
            )}

            {errors.timeSlot && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                {errors.timeSlot.message}
              </p>
            )}
          </div>

          {/* Symptoms */}
          <div>
            <label className="label">Symptoms / Notes</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Brief description of symptoms..."
              {...register('symptoms')}
            />
          </div>

          {/* Fee preview */}
          {selectedDoctor && (
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--brand-light)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--brand-dark)' }}>
                Consultation Fee
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: 'var(--brand)', fontFamily: 'Outfit' }}
              >
                PKR {selectedDoctor.consultationFee?.toLocaleString() || '500'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !slotsData?.available || slotsData?.slots?.length === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Booking...</>
                : 'Book Appointment'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
