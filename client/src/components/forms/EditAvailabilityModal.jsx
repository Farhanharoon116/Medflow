import { useState } from 'react'
import { X, Clock, Save, Loader2, CheckCircle } from 'lucide-react'
import api from '../../api/axiosInstance'
import toast from 'react-hot-toast'

const DAYS = [
  { key: 'monday',    label: 'Monday'    },
  { key: 'tuesday',   label: 'Tuesday'   },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday'  },
  { key: 'friday',    label: 'Friday'    },
  { key: 'saturday',  label: 'Saturday'  },
  { key: 'sunday',    label: 'Sunday'    },
]

const DEFAULT_DAY = { isAvailable: false, startTime: '09:00', endTime: '17:00' }

export default function EditAvailabilityModal({ doctor, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [slotDuration, setSlotDuration] = useState(
    doctor.availability?.slotDurationMinutes || 30
  )
  const [schedule, setSchedule] = useState(() => {
    const s = {}
    DAYS.forEach(({ key }) => {
      s[key] = {
        isAvailable: doctor.availability?.[key]?.isAvailable || false,
        startTime:   doctor.availability?.[key]?.startTime   || '09:00',
        endTime:     doctor.availability?.[key]?.endTime     || '17:00',
      }
    })
    return s
  })

  const toggle = (day) => {
    setSchedule(s => ({
      ...s,
      [day]: { ...s[day], isAvailable: !s[day].isAvailable },
    }))
  }

  const updateTime = (day, field, value) => {
    setSchedule(s => ({
      ...s,
      [day]: { ...s[day], [field]: value },
    }))
  }

  // Quick presets
  const applyPreset = (preset) => {
    const newSchedule = {}
    DAYS.forEach(({ key }) => {
      if (preset === 'weekdays') {
        newSchedule[key] = {
          isAvailable: !['saturday', 'sunday'].includes(key),
          startTime: '09:00',
          endTime:   '17:00',
        }
      } else if (preset === 'alldays') {
        newSchedule[key] = { isAvailable: true, startTime: '09:00', endTime: '17:00' }
      } else {
        newSchedule[key] = { ...DEFAULT_DAY }
      }
    })
    setSchedule(newSchedule)
  }

  const handleSave = async () => {
    // Validate: available days must have valid times
    for (const { key, label } of DAYS) {
      if (schedule[key].isAvailable) {
        const [sh, sm] = schedule[key].startTime.split(':').map(Number)
        const [eh, em] = schedule[key].endTime.split(':').map(Number)
        if (sh * 60 + sm >= eh * 60 + em) {
          toast.error(`${label}: end time must be after start time`)
          return
        }
      }
    }

    setLoading(true)
    try {
      await api.patch(`/auth/staff/${doctor._id}/availability`, {
        availability: { ...schedule, slotDurationMinutes: slotDuration },
      })
      toast.success('Availability updated successfully!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update availability')
    } finally {
      setLoading(false)
    }
  }

  const availableDaysCount = DAYS.filter(({ key }) => schedule[key].isAvailable).length

  return (
    <div className="modal-overlay">
      <div className="modal-box w-full max-w-xl">

        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2
              className="font-bold text-lg"
              style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
            >
              Edit Availability
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Dr. {doctor.name} · {availableDaysCount} day{availableDaysCount !== 1 ? 's' : ''} active
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Quick presets */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-3)' }}
            >
              Quick Presets
            </p>
            <div className="flex gap-2">
              {[
                { id: 'weekdays', label: 'Mon–Fri' },
                { id: 'alldays',  label: 'All Days' },
                { id: 'clear',    label: 'Clear All' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slot duration */}
          <div className="flex items-center gap-4 p-3 rounded-xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <Clock size={15} style={{ color: 'var(--brand)' }} />
            <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-1)' }}>
              Appointment slot duration
            </p>
            <select
              className="input w-auto py-1.5 text-sm"
              value={slotDuration}
              onChange={e => setSlotDuration(parseInt(e.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          {/* Weekly schedule */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-3)' }}
            >
              Weekly Schedule
            </p>
            <div className="space-y-2">
              {DAYS.map(({ key, label }) => {
                const day = schedule[key]
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: day.isAvailable ? 'var(--brand-light)' : 'var(--surface-2)',
                      border: `1px solid ${day.isAvailable ? 'rgba(0,200,150,0.2)' : 'var(--border)'}`,
                    }}
                  >
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="flex-shrink-0 w-10 h-6 rounded-full transition-all relative"
                      style={{
                        background: day.isAvailable ? 'var(--brand)' : 'var(--border-strong)',
                      }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                        style={{
                          left: day.isAvailable ? '18px' : '2px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      />
                    </button>

                    {/* Day label */}
                    <span
                      className="text-sm font-semibold w-24 flex-shrink-0"
                      style={{ color: day.isAvailable ? 'var(--brand-dark)' : 'var(--text-3)' }}
                    >
                      {label}
                    </span>

                    {/* Time inputs */}
                    {day.isAvailable ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          className="input py-1 text-sm w-auto"
                          value={day.startTime}
                          onChange={e => updateTime(key, 'startTime', e.target.value)}
                        />
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>to</span>
                        <input
                          type="time"
                          className="input py-1 text-sm w-auto"
                          value={day.endTime}
                          onChange={e => updateTime(key, 'endTime', e.target.value)}
                        />
                        {/* Slot count preview */}
                        {(() => {
                          const [sh, sm] = day.startTime.split(':').map(Number)
                          const [eh, em] = day.endTime.split(':').map(Number)
                          const totalMins = (eh * 60 + em) - (sh * 60 + sm)
                          const count = Math.floor(totalMins / slotDuration)
                          return count > 0 ? (
                            <span className="badge-brand ml-auto text-xs">
                              {count} slots
                            </span>
                          ) : null
                        })()}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-4)' }}>
                        Not available
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                : <><Save size={15} /> Save Schedule</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
