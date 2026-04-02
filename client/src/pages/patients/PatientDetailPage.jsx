import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, User, Phone, Mail, MapPin,
  Calendar, FileText, Loader2, Edit2, X,
  Save, Plus, Trash2, AlertTriangle, Activity, FlaskConical,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance'
import useAuthStore from '../../store/authStore'
import RecordVitalsModal from '../../components/forms/RecordVitalsModal'
import UploadLabResultModal from '../../components/forms/UploadLabResultModal'
import VitalsChart from '../../components/charts/VitalsChart'
import LabResultCard from '../../components/LabResultCard'
import {
  getBpLevel,
  getHeartRateLevel,
  getTemperatureLevel,
  getSpO2Level,
  getGlucoseLevel,
  levelToStyle,
} from '../../utils/vitalsRanges'

const statusColors = {
  pending:   'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  'no-show': 'badge-gray',
}

// ── Edit Patient Modal ───────────────────────────────────────────────
function EditPatientModal({ patient, onClose, onSuccess }) {
  const [form, setForm]           = useState({
    name:              patient.name || '',
    age:               patient.age || '',
    gender:            patient.gender || '',
    phone:             patient.phone || '',
    email:             patient.email || '',
    address:           patient.address || '',
    bloodGroup:        patient.bloodGroup || 'Unknown',
    allergies:         patient.allergies || [],
    chronicConditions: patient.chronicConditions || [],
  })
  const [allergyInput,   setAllergyInput]   = useState('')
  const [conditionInput, setConditionInput] = useState('')
  const [loading, setLoading]               = useState(false)

  const addItem = (list, setList, input, setInput, field) => {
    if (!input.trim()) return
    setForm(f => ({ ...f, [field]: [...f[field], input.trim()] }))
    setInput('')
  }

  const removeItem = (field, index) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }))
  }

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch(`/patients/${patient._id}`, {
        ...form,
        age: parseInt(form.age),
      })
      toast.success('Patient updated successfully!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box w-full max-w-lg">
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            className="font-bold text-lg"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            Edit Patient
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="label">Full Name *</label>
            <input
              name="name"
              className="input"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Age + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Age *</label>
              <input
                name="age"
                type="number"
                className="input"
                value={form.age}
                onChange={handleChange}
                min="0"
                max="150"
                required
              />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select
                name="gender"
                className="input"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Phone + Blood Group */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input
                name="phone"
                className="input"
                value={form.phone}
                onChange={handleChange}
                placeholder="03001234567"
              />
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select
                name="bloodGroup"
                className="input"
                value={form.bloodGroup}
                onChange={handleChange}
              >
                <option value="Unknown">Unknown</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={handleChange}
              placeholder="patient@email.com"
            />
          </div>

          {/* Address */}
          <div>
            <label className="label">Address</label>
            <input
              name="address"
              className="input"
              value={form.address}
              onChange={handleChange}
              placeholder="House 12, Block 5, Karachi"
            />
          </div>

          {/* Allergies */}
          <div>
            <label className="label">Allergies</label>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="e.g. Penicillin"
                value={allergyInput}
                onChange={e => setAllergyInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem(form.allergies, null, allergyInput, setAllergyInput, 'allergies')
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary px-3 flex-shrink-0"
                onClick={() => addItem(form.allergies, null, allergyInput, setAllergyInput, 'allergies')}
              >
                <Plus size={15} />
              </button>
            </div>
            {form.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.allergies.map((a, i) => (
                  <span key={i} className="badge-danger flex items-center gap-1">
                    {a}
                    <button type="button" onClick={() => removeItem('allergies', i)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Chronic Conditions */}
          <div>
            <label className="label">Chronic Conditions</label>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="e.g. Diabetes"
                value={conditionInput}
                onChange={e => setConditionInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem(form.chronicConditions, null, conditionInput, setConditionInput, 'chronicConditions')
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary px-3 flex-shrink-0"
                onClick={() => addItem(form.chronicConditions, null, conditionInput, setConditionInput, 'chronicConditions')}
              >
                <Plus size={15} />
              </button>
            </div>
            {form.chronicConditions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.chronicConditions.map((c, i) => (
                  <span key={i} className="badge-warning flex items-center gap-1">
                    {c}
                    <button type="button" onClick={() => removeItem('chronicConditions', i)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                : <><Save size={15} /> Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const { user }    = useAuthStore()
  const [showEdit, setShowEdit] = useState(false)
  const [showVitals, setShowVitals] = useState(false)
  const [showLabUpload, setShowLabUpload] = useState(false)
  const [detailTab, setDetailTab] = useState('overview')
  const canEdit = ['admin', 'doctor', 'receptionist'].includes(user?.role)
  const canRecordVitals = ['admin', 'doctor'].includes(user?.role)
  const canUploadLabs = ['admin', 'doctor', 'receptionist'].includes(user?.role)
  const canUpdateLabStatus = ['admin', 'doctor'].includes(user?.role)

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await api.get(`/patients/${id}`)
      return data.patient
    },
  })

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['patientHistory', id],
    queryFn: async () => {
      const { data } = await api.get(`/patients/${id}/history`)
      return data.history
    },
  })

  const { data: vitalsData, isLoading: loadingVitals } = useQuery({
    queryKey: ['vitals', id],
    queryFn: async () => {
      const { data } = await api.get(`/vitals/patient/${id}`)
      return data
    },
  })

  const { data: latestVitalsRes } = useQuery({
    queryKey: ['vitalsLatest', id],
    queryFn: async () => {
      const { data } = await api.get(`/vitals/latest/${id}`)
      return data
    },
  })

  const latest = latestVitalsRes?.vitals
  const vitalsList = vitalsData?.vitals || []

  const { data: labsData, isLoading: loadingLabs } = useQuery({
    queryKey: ['labs', id],
    queryFn: async () => {
      const { data } = await api.get(`/labs/patient/${id}`)
      return data
    },
    enabled: !!id,
  })
  const labsList = labsData?.labResults || []

  const deleteLabMutation = useMutation({
    mutationFn: (labId) => api.delete(`/labs/${labId}`),
    onSuccess: () => {
      toast.success('Lab result deleted')
      queryClient.invalidateQueries({ queryKey: ['labs', id] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  const patchLabStatusMutation = useMutation({
    mutationFn: ({ labId, status }) => api.patch(`/labs/${labId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', id] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  if (loadingPatient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  const p = patient

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm transition-colors btn-ghost -ml-2"
        style={{ color: 'var(--text-3)' }}
      >
        <ArrowLeft size={15} /> Back to Patients
      </button>

      {/* Patient Header Card */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ background: 'var(--navy)', fontFamily: 'Outfit' }}
            >
              {p?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Outfit', color: 'var(--text-1)', letterSpacing: '-0.02em' }}
              >
                {p?.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
                {p?.age} years old ·{' '}
                <span className="capitalize">{p?.gender}</span> ·{' '}
                <span className="font-semibold">{p?.bloodGroup}</span>
              </p>
              <div className="flex flex-wrap gap-4 mt-3">
                {p?.phone && (
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                    <Phone size={13} style={{ color: 'var(--text-4)' }} /> {p.phone}
                  </span>
                )}
                {p?.email && (
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                    <Mail size={13} style={{ color: 'var(--text-4)' }} /> {p.email}
                  </span>
                )}
                {p?.address && (
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                    <MapPin size={13} style={{ color: 'var(--text-4)' }} /> {p.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit + vitals — staff */}
          <div className="flex flex-wrap gap-2 justify-end">
            {canRecordVitals && (
              <button
                type="button"
                onClick={() => setShowVitals(true)}
                className="btn-primary flex items-center gap-2 flex-shrink-0"
              >
                <Activity size={15} /> Record Vitals
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="btn-secondary flex items-center gap-2 flex-shrink-0"
              >
                <Edit2 size={15} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {(p?.allergies?.length > 0 || p?.chronicConditions?.length > 0) && (
          <div
            className="mt-4 pt-4 flex flex-wrap gap-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {p?.allergies?.map(a => (
              <span key={a} className="badge-danger">
                <AlertTriangle size={10} /> {a}
              </span>
            ))}
            {p?.chronicConditions?.map(c => (
              <span key={c} className="badge-warning">{c}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setDetailTab('overview')}
          className={detailTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
        >
          Overview & History
        </button>
        <button
          type="button"
          onClick={() => setDetailTab('labs')}
          className={`flex items-center gap-2 ${detailTab === 'labs' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FlaskConical size={16} /> Lab Results
        </button>
      </div>

      {detailTab === 'overview' && (
      <>
      {/* Risk Flag — shown if 3+ diagnoses in 30 days */}
      {historyData?.diagnosisLogs?.length >= 3 && (
        <div
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <AlertTriangle size={18} style={{ color: '#c2410c', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#c2410c' }}>
              Risk Flag — Frequent Medical Visits
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9a3412' }}>
              This patient has {historyData.diagnosisLogs.length} diagnosis records.
              Consider reviewing for chronic or recurring conditions.
            </p>
          </div>
        </div>
      )}

      {/* Medical History Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Appointments */}
        <div className="card">
          <h3
            className="font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            <Calendar size={16} style={{ color: 'var(--brand)' }} />
            Appointment History
          </h3>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="spinner w-6 h-6" />
            </div>
          ) : historyData?.appointments?.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No appointments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyData?.appointments?.map(apt => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                      Dr. {apt.doctor?.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {format(new Date(apt.date), 'dd MMM yyyy')} · {apt.timeSlot}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                      {format(new Date(apt.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <span className={statusColors[apt.status] || 'badge-gray'}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        <div className="card">
          <h3
            className="font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            <FileText size={16} style={{ color: 'var(--brand)' }} />
            Prescription History
          </h3>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="spinner w-6 h-6" />
            </div>
          ) : historyData?.prescriptions?.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No prescriptions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyData?.prescriptions?.map(rx => (
                <div
                  key={rx._id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                      {rx.diagnosis}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      Dr. {rx.doctor?.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                      {format(new Date(rx.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  {rx.pdfUrl && (
                    <a
                      href={rx.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                    >
                      PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnosis Logs */}
        <div className="card xl:col-span-2">
          <h3
            className="font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            <User size={16} style={{ color: 'var(--brand)' }} />
            Diagnosis History
          </h3>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="spinner w-6 h-6" />
            </div>
          ) : historyData?.diagnosisLogs?.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No diagnosis logs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyData?.diagnosisLogs?.map((log, i) => (
                <div
                  key={log._id}
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                          Symptoms: {log.inputSymptoms}
                        </p>
                        {log.aiResponse?.riskLevel && (
                          <span className={
                            log.aiResponse.riskLevel === 'high'   ? 'badge-danger'  :
                            log.aiResponse.riskLevel === 'medium' ? 'badge-warning' :
                            'badge-success'
                          }>
                            {log.aiResponse.riskLevel} risk
                          </span>
                        )}
                      </div>
                      {log.aiResponse?.conditions?.length > 0 && (
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                          Possible: {log.aiResponse.conditions.join(', ')}
                        </p>
                      )}
                      {log.confirmedDiagnosis && (
                        <p className="text-xs font-semibold mt-1" style={{ color: 'var(--brand)' }}>
                          Confirmed: {log.confirmedDiagnosis}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                        Dr. {log.doctor?.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                        {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Vitals History */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3
            className="font-bold flex items-center gap-2"
            style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
          >
            <Activity size={18} style={{ color: 'var(--brand)' }} />
            Vitals History
          </h3>
          {latest?.recordedAt && (
            <span className="badge-gray text-xs">
              Last recorded {format(new Date(latest.recordedAt), 'dd MMM yyyy, HH:mm')}
            </span>
          )}
        </div>

        {loadingVitals ? (
          <div className="flex justify-center py-12">
            <div className="spinner w-8 h-8" />
          </div>
        ) : vitalsList.length === 0 ? (
          <div className="empty-state py-10">
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              No vitals recorded yet
            </p>
            {canRecordVitals && (
              <button type="button" onClick={() => setShowVitals(true)} className="btn-primary mt-4 text-sm">
                Record first vitals
              </button>
            )}
          </div>
        ) : (
          <>
            {latest && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <VitalStat
                  label="Blood pressure"
                  value={
                    latest.bloodPressure?.systolic != null && latest.bloodPressure?.diastolic != null
                      ? `${latest.bloodPressure.systolic}/${latest.bloodPressure.diastolic}`
                      : '—'
                  }
                  unit="mmHg"
                  level={getBpLevel(latest.bloodPressure?.systolic, latest.bloodPressure?.diastolic)}
                />
                <VitalStat
                  label="Heart rate"
                  value={latest.heartRate != null ? String(latest.heartRate) : '—'}
                  unit="bpm"
                  level={getHeartRateLevel(latest.heartRate)}
                />
                <VitalStat
                  label="Temperature"
                  value={latest.temperature != null ? String(latest.temperature) : '—'}
                  unit="°C"
                  level={getTemperatureLevel(latest.temperature)}
                />
                <VitalStat
                  label="Weight"
                  value={latest.weight != null ? String(latest.weight) : '—'}
                  unit="kg"
                  level="neutral"
                />
                <VitalStat
                  label="SpO₂"
                  value={latest.oxygenSaturation != null ? String(latest.oxygenSaturation) : '—'}
                  unit="%"
                  level={getSpO2Level(latest.oxygenSaturation)}
                />
                <VitalStat
                  label="Glucose"
                  value={latest.bloodGlucose != null ? String(latest.bloodGlucose) : '—'}
                  unit="mg/dL"
                  level={getGlucoseLevel(latest.bloodGlucose)}
                />
              </div>
            )}

            {vitalsList.length > 0 && (
              <div className="space-y-4" style={{ borderTop: latest ? '1px solid var(--border)' : 'none', paddingTop: latest ? '1.5rem' : 0 }}>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-3)' }}
                >
                  Trends (last 10 readings)
                </p>
                <VitalsChart vitals={vitalsList} />
              </div>
            )}
          </>
        )}
      </div>
      </>
      )}

      {detailTab === 'labs' && (
        <div className="space-y-4">
          {canUploadLabs && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowLabUpload(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FlaskConical size={16} /> Upload Lab Result
              </button>
            </div>
          )}
          {loadingLabs ? (
            <div className="flex justify-center py-16">
              <div className="spinner w-8 h-8" />
            </div>
          ) : labsList.length === 0 ? (
            <div className="card empty-state py-12">
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                No lab results uploaded yet
              </p>
              {canUploadLabs && (
                <button
                  type="button"
                  onClick={() => setShowLabUpload(true)}
                  className="btn-primary mt-4 text-sm"
                >
                  Upload first result
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {labsList.map((lab) => (
                <LabResultCard
                  key={lab._id}
                  lab={lab}
                  canDelete={user?.role === 'admin'}
                  canUpdateStatus={canUpdateLabStatus}
                  onDelete={(labId) => {
                    if (window.confirm('Delete this lab result permanently?')) {
                      deleteLabMutation.mutate(labId)
                    }
                  }}
                  onStatusChange={(labId, status) =>
                    patchLabStatusMutation.mutate({ labId, status })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <EditPatientModal
          patient={p}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false)
            queryClient.invalidateQueries(['patient', id])
            queryClient.invalidateQueries(['patients'])
          }}
        />
      )}

      {showVitals && p && (
        <RecordVitalsModal
          patientId={p._id}
          patientName={p.name}
          onClose={() => setShowVitals(false)}
        />
      )}

      {showLabUpload && p && (
        <UploadLabResultModal
          patientId={p._id}
          patientName={p.name}
          onClose={() => setShowLabUpload(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['labs', id] })
          }}
        />
      )}
    </div>
  )
}

function VitalStat({ label, value, unit, level }) {
  const s = levelToStyle(level)
  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        borderColor: s.borderColor,
        background: s.background,
        borderLeft: `4px solid ${s.color}`,
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
        {label}
      </p>
      <p
        className="text-2xl font-bold leading-tight"
        style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-1)' }}
      >
        {value}
        {value !== '—' && unit && (
          <span className="text-sm font-semibold ml-1" style={{ color: 'var(--text-3)' }}>
            {unit}
          </span>
        )}
      </p>
    </div>
  )
}