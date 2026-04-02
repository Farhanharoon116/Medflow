import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'
import SymptomCheckerModal from '../../components/forms/SymptomCheckerModal'

const emptyMedicine = {
  name: '', dosage: '', frequency: '', duration: '', instructions: '',
}

export default function CreatePrescriptionPage() {
  const navigate              = useNavigate()
  const { user }              = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [medicines, setMedicines] = useState([{ ...emptyMedicine }])
  const [showAI, setShowAI]   = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm()
  const watchedPatient = watch('patientId')

  const { data: patients } = useQuery({
    queryKey: ['patientsAll'],
    queryFn: async () => {
      const { data } = await api.get('/patients', { params: { limit: 200 } })
      return data.patients
    },
  })

  const handlePatientChange = (e) => {
    const p = patients?.find(p => p._id === e.target.value)
    setSelectedPatient(p || null)
    setValue('patientId', e.target.value)
  }

  const addMedicine    = () => setMedicines([...medicines, { ...emptyMedicine }])
  const removeMedicine = (i) => { if (medicines.length > 1) setMedicines(medicines.filter((_, idx) => idx !== i)) }
  const updateMedicine = (i, field, value) => {
    const updated = [...medicines]
    updated[i][field] = value
    setMedicines(updated)
  }

  // Called when AI suggests a condition — auto-fills diagnosis field
  const handleAIApply = (condition) => {
    setValue('diagnosis', condition)
  }

  const onSubmit = async (data) => {
    const invalid = medicines.find(m => !m.name || !m.dosage || !m.frequency || !m.duration)
    if (invalid) { toast.error('Please fill all required medicine fields'); return }

    setLoading(true)
    try {
      const { data: res } = await api.post('/prescriptions', {
        ...data,
        medicines,
        generateAiExplanation: user?.plan === 'pro',
      })
      toast.success('Prescription created!')
      if (res.prescription?.pdfUrl) toast.success('PDF generated and uploaded to Cloudinary!')
      navigate('/dashboard/prescriptions')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm btn-ghost -ml-2"
        style={{ color: 'var(--text-3)' }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div>
        <h1 className="page-title">New Prescription</h1>
        <p className="page-subtitle">
          Create a prescription — PDF is generated and uploaded automatically
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Patient & Diagnosis ─────────────────────────────── */}
        <div className="card space-y-4">
          <h3
            className="font-bold"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            Patient & Diagnosis
          </h3>

          {/* Patient */}
          <div>
            <label className="label">Patient *</label>
            <select
              className="input"
              {...register('patientId', { required: 'Patient is required' })}
              onChange={handlePatientChange}
            >
              <option value="">Select patient...</option>
              {patients?.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.phone || p.age + ' yrs'}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                {errors.patientId.message}
              </p>
            )}
          </div>

          {/* AI Symptom Checker Button */}
          {watchedPatient && (
            <button
              type="button"
              onClick={() => setShowAI(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
              style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
            >
              <Sparkles size={15} />
              Run AI Symptom Check for {selectedPatient?.name || 'Patient'}
            </button>
          )}

          {/* Diagnosis */}
          <div>
            <label className="label">Diagnosis *</label>
            <input
              className="input"
              placeholder="e.g. Acute Upper Respiratory Tract Infection"
              {...register('diagnosis', { required: 'Diagnosis is required' })}
            />
            {errors.diagnosis && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>
                {errors.diagnosis.message}
              </p>
            )}
          </div>

          {/* General Instructions */}
          <div>
            <label className="label">General Instructions</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="e.g. Rest well, drink plenty of fluids, avoid cold drinks..."
              {...register('instructions')}
            />
          </div>

          {/* Follow-up */}
          <div>
            <label className="label">Follow-up Date</label>
            <input
              type="date"
              className="input w-auto"
              min={new Date().toISOString().split('T')[0]}
              {...register('followUpDate')}
            />
          </div>
        </div>

        {/* ── Medicines ────────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-bold"
              style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
            >
              Medicines
            </h3>
            <button
              type="button"
              onClick={addMedicine}
              className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
            >
              <Plus size={15} /> Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {medicines.map((med, i) => (
              <div
                key={i}
                className="p-4 rounded-xl space-y-3"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-3)' }}
                  >
                    Medicine {i + 1}
                  </span>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(i)}
                      className="btn-ghost p-1"
                      style={{ color: 'var(--red)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Name *</label>
                    <input
                      className="input"
                      style={{ background: 'var(--surface)' }}
                      placeholder="e.g. Augmentin 625mg"
                      value={med.name}
                      onChange={e => updateMedicine(i, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Dosage *</label>
                    <input
                      className="input"
                      style={{ background: 'var(--surface)' }}
                      placeholder="e.g. 625mg"
                      value={med.dosage}
                      onChange={e => updateMedicine(i, 'dosage', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Frequency *</label>
                    <select
                      className="input"
                      style={{ background: 'var(--surface)' }}
                      value={med.frequency}
                      onChange={e => updateMedicine(i, 'frequency', e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option>Once daily</option>
                      <option>Twice daily</option>
                      <option>Three times daily</option>
                      <option>Four times daily</option>
                      <option>Every 8 hours</option>
                      <option>Every 6 hours</option>
                      <option>Once at night</option>
                      <option>As needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Duration *</label>
                    <select
                      className="input"
                      style={{ background: 'var(--surface)' }}
                      value={med.duration}
                      onChange={e => updateMedicine(i, 'duration', e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option>3 days</option>
                      <option>5 days</option>
                      <option>7 days</option>
                      <option>10 days</option>
                      <option>14 days</option>
                      <option>1 month</option>
                      <option>3 months</option>
                      <option>Ongoing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Special Instructions</label>
                  <input
                    className="input"
                    style={{ background: 'var(--surface)' }}
                    placeholder="e.g. Take after meals"
                    value={med.instructions}
                    onChange={e => updateMedicine(i, 'instructions', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Notice (Pro) ──────────────────────────────────── */}
        {user?.plan === 'pro' && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'var(--brand-light)', border: '1px solid rgba(0,200,150,0.2)' }}
          >
            <Sparkles size={16} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: 'var(--brand-dark)' }}>
              <strong>Pro plan:</strong> AI patient explanation will be generated automatically
              in English and Urdu and attached to this prescription.
            </p>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
              ? <><Loader2 size={16} className="animate-spin" /> Generating PDF...</>
              : 'Create Prescription & Generate PDF'
            }
          </button>
        </div>
      </form>

      {/* AI Symptom Checker Modal */}
      {showAI && selectedPatient && (
        <SymptomCheckerModal
          patientId={selectedPatient._id}
          patientName={selectedPatient.name}
          onClose={() => setShowAI(false)}
          onApply={handleAIApply}
        />
      )}
    </div>
  )
}