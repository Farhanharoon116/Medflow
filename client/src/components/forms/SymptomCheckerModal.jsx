import { useState } from 'react'
import { X, Sparkles, Loader2, AlertTriangle, CheckCircle, FlaskConical } from 'lucide-react'
import api from '../../api/axiosInstance'
import toast from 'react-hot-toast'

const riskColors = {
  low:    { bg: '#dcfce7', color: '#15803d', label: 'Low Risk' },
  medium: { bg: '#fef3c7', color: '#b45309', label: 'Medium Risk' },
  high:   { bg: '#fee2e2', color: '#dc2626', label: 'High Risk' },
}

export default function SymptomCheckerModal({ patientId, patientName, onClose, onApply }) {
  const [symptoms,  setSymptoms]  = useState('')
  const [history,   setHistory]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [aiDown,    setAiDown]    = useState(false)

  const handleCheck = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter symptoms')
      return
    }
    setLoading(true)
    setResult(null)
    setAiDown(false)
    try {
      const { data } = await api.post('/prescriptions/ai/symptom-check', {
        patientId,
        symptoms,
        relevantHistory: history,
      })
      if (data.aiAvailable && !data.result?.error) {
        setResult(data.result)
      } else {
        setAiDown(true)
      }
    } catch (err) {
      toast.error('Symptom check failed')
    } finally {
      setLoading(false)
    }
  }

  const risk = result?.riskLevel ? riskColors[result.riskLevel] : null

  return (
    <div className="modal-overlay">
      <div className="modal-box w-full max-w-lg">

        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--brand-light)' }}
            >
              <Sparkles size={16} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <h2
                className="font-bold text-base"
                style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
              >
                AI Symptom Checker
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Patient: {patientName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Symptoms Input */}
          <div>
            <label className="label">Symptoms *</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Fever for 3 days, dry cough, sore throat, fatigue..."
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
            />
          </div>

          {/* History Input */}
          <div>
            <label className="label">Relevant History</label>
            <input
              className="input"
              placeholder="e.g. Diabetic, hypertensive, recent travel..."
              value={history}
              onChange={e => setHistory(e.target.value)}
            />
          </div>

          {/* Check Button */}
          <button
            onClick={handleCheck}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Analysing with Gemini AI...</>
              : <><Sparkles size={15} /> Run AI Analysis</>
            }
          </button>

          {/* AI Unavailable */}
          {aiDown && (
            <div
              className="p-4 rounded-xl flex items-start gap-3"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
            >
              <AlertTriangle size={16} style={{ color: '#c2410c', flexShrink: 0 }} />
              <p className="text-sm" style={{ color: '#9a3412' }}>
                AI is temporarily unavailable. Please proceed with manual diagnosis.
                The system continues to work normally without AI.
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-fade-in">

              {/* Risk Level */}
              {risk && (
                <div
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ background: risk.bg }}
                >
                  <AlertTriangle size={16} style={{ color: risk.color }} />
                  <span
                    className="text-sm font-bold"
                    style={{ color: risk.color }}
                  >
                    {risk.label}
                  </span>
                </div>
              )}

              {/* Possible Conditions */}
              {result.conditions?.length > 0 && (
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: 'var(--text-3)' }}
                  >
                    Possible Conditions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.conditions.map((c, i) => (
                      <span key={i} className="badge-info">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Tests */}
              {result.suggestedTests?.length > 0 && (
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: 'var(--text-3)' }}
                  >
                    Suggested Tests
                  </p>
                  <div className="space-y-1.5">
                    {result.suggestedTests.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <FlaskConical size={13} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                        <span className="text-sm" style={{ color: 'var(--text-2)' }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              {result.reasoning && (
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-3)' }}
                  >
                    Clinical Reasoning
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {result.reasoning}
                  </p>
                </div>
              )}

              {/* Apply to Diagnosis */}
              <button
                onClick={() => {
                  onApply(result.conditions?.[0] || '')
                  onClose()
                  toast.success('AI suggestion applied to diagnosis field')
                }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <CheckCircle size={15} />
                Apply Top Condition to Diagnosis
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <p
            className="text-xs text-center"
            style={{ color: 'var(--text-4)' }}
          >
            AI suggestions are for reference only. Clinical judgment takes precedence.
          </p>
        </div>
      </div>
    </div>
  )
}