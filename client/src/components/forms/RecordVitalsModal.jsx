import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance'
import {
  getBpLevel,
  getHeartRateLevel,
  getTemperatureLevel,
  getSpO2Level,
  getGlucoseLevel,
  levelToStyle,
} from '../../utils/vitalsRanges'

function InputShell({ label, hint, children, level }) {
  const s = levelToStyle(level)
  return (
    <div>
      <label className="label">{label}</label>
      {hint && (
        <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
          {hint}
        </p>
      )}
      <div
        className="rounded-xl border-2 transition-colors"
        style={{ borderColor: s.borderColor, background: s.background }}
      >
        {children}
      </div>
    </div>
  )
}

export default function RecordVitalsModal({ patientId, patientName, onClose, onSuccess }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    systolic: '',
    diastolic: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygenSaturation: '',
    bloodGlucose: '',
    notes: '',
  })

  const mutation = useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post('/vitals', body)
      return data
    },
    onSuccess: () => {
      toast.success('Vital signs saved')
      queryClient.invalidateQueries({ queryKey: ['vitals', patientId] })
      queryClient.invalidateQueries({ queryKey: ['vitalsLatest', patientId] })
      queryClient.invalidateQueries({ queryKey: ['vitalsRecentCount'] })
      onSuccess?.()
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not save vitals')
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const bloodPressure =
      form.systolic !== '' || form.diastolic !== ''
        ? {
            systolic: form.systolic !== '' ? form.systolic : undefined,
            diastolic: form.diastolic !== '' ? form.diastolic : undefined,
          }
        : undefined

    mutation.mutate({
      patientId,
      bloodPressure,
      heartRate: form.heartRate,
      temperature: form.temperature,
      weight: form.weight,
      height: form.height,
      oxygenSaturation: form.oxygenSaturation,
      bloodGlucose: form.bloodGlucose,
      notes: form.notes,
    })
  }

  const bpLevel = getBpLevel(
    form.systolic !== '' ? form.systolic : null,
    form.diastolic !== '' ? form.diastolic : null
  )
  const hrLevel = getHeartRateLevel(form.heartRate)
  const tempLevel = getTemperatureLevel(form.temperature)
  const spo2Level = getSpO2Level(form.oxygenSaturation)
  const glucoseLevel = getGlucoseLevel(form.bloodGlucose)

  const inputClass =
    'w-full bg-transparent border-0 rounded-xl px-3 py-2.5 text-sm focus:ring-0 focus:outline-none'

  return (
    <div className="modal-overlay">
      <div className="modal-box w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div
          className="flex items-center justify-between p-6 sticky top-0 z-10"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand-light)' }}
            >
              <Activity size={18} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <h2
                className="font-bold text-lg"
                style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
              >
                Record Vitals
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                {patientName}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            All measurements are optional except the patient. Normal ranges are shown as hints; fields
            highlight green / amber / red by value.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <InputShell
              label="Systolic (mmHg)"
              hint="Normal: ~90–120"
              level={form.systolic !== '' || form.diastolic !== '' ? bpLevel : 'neutral'}
            >
              <input
                name="systolic"
                type="number"
                className={inputClass}
                placeholder="120"
                value={form.systolic}
                onChange={handleChange}
                min={0}
                max={300}
              />
            </InputShell>
            <InputShell
              label="Diastolic (mmHg)"
              hint="Normal: ~60–80"
              level={form.systolic !== '' || form.diastolic !== '' ? bpLevel : 'neutral'}
            >
              <input
                name="diastolic"
                type="number"
                className={inputClass}
                placeholder="80"
                value={form.diastolic}
                onChange={handleChange}
                min={0}
                max={200}
              />
            </InputShell>
          </div>

          <InputShell
            label="Heart rate (bpm)"
            hint="Normal: 60–100 bpm"
            level={hrLevel}
          >
            <input
              name="heartRate"
              type="number"
              className={inputClass}
              placeholder="72"
              value={form.heartRate}
              onChange={handleChange}
              min={0}
              max={300}
            />
          </InputShell>

          <InputShell
            label="Temperature (°C)"
            hint="Normal: 36.1–37.2°C"
            level={tempLevel}
          >
            <input
              name="temperature"
              type="number"
              step="0.1"
              className={inputClass}
              placeholder="36.8"
              value={form.temperature}
              onChange={handleChange}
              min={30}
              max={45}
            />
          </InputShell>

          <div className="grid grid-cols-2 gap-3">
            <InputShell label="Weight (kg)" hint="—" level="neutral">
              <input
                name="weight"
                type="number"
                step="0.1"
                className={inputClass}
                placeholder="70"
                value={form.weight}
                onChange={handleChange}
                min={0}
              />
            </InputShell>
            <InputShell label="Height (cm)" hint="—" level="neutral">
              <input
                name="height"
                type="number"
                step="0.1"
                className={inputClass}
                placeholder="170"
                value={form.height}
                onChange={handleChange}
                min={0}
              />
            </InputShell>
          </div>

          <InputShell
            label="Oxygen saturation (%)"
            hint="Normal: 95–100%"
            level={spo2Level}
          >
            <input
              name="oxygenSaturation"
              type="number"
              className={inputClass}
              placeholder="98"
              value={form.oxygenSaturation}
              onChange={handleChange}
              min={0}
              max={100}
            />
          </InputShell>

          <InputShell
            label="Blood glucose (mg/dL)"
            hint="Normal (fasting): 70–100 mg/dL"
            level={glucoseLevel}
          >
            <input
              name="bloodGlucose"
              type="number"
              className={inputClass}
              placeholder="92"
              value={form.bloodGlucose}
              onChange={handleChange}
              min={0}
            />
          </InputShell>

          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              className="input min-h-[80px] resize-y"
              placeholder="Optional context…"
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                'Save vitals'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
