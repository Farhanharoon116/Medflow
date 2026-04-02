import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Loader2, Upload, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance'

export default function UploadLabResultModal({ patientId, patientName, onClose, onSuccess }) {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    testName: '',
    testDate: new Date().toISOString().slice(0, 10),
    labName: '',
    doctorId: '',
    notes: '',
    isSharedWithPatient: true,
  })

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data } = await api.get('/auth/doctors')
      return data
    },
  })
  const doctors = doctorsData?.doctors || []

  const clearFile = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const pickFile = useCallback((f) => {
    if (!f) return
    const ok =
      f.type === 'application/pdf' || /^image\/(jpeg|jpg|png|gif|webp)$/i.test(f.type)
    if (!ok) {
      toast.error('Please choose a PDF or image file.')
      return
    }
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return f.type.startsWith('image/') ? URL.createObjectURL(f) : null
    })
    setFile(f)
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    pickFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !form.testName.trim() || !form.testDate) return

    setUploading(true)
    setProgress(0)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('patientId', patientId)
      fd.append('testName', form.testName.trim())
      fd.append('testDate', form.testDate)
      if (form.labName.trim()) fd.append('labName', form.labName.trim())
      if (form.doctorId) fd.append('doctorId', form.doctorId)
      if (form.notes.trim()) fd.append('notes', form.notes.trim())
      fd.append('isSharedWithPatient', form.isSharedWithPatient ? 'true' : 'false')

      await api.post('/labs/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total))
        },
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const isPdf = file?.type === 'application/pdf'

  return (
    <div className="modal-overlay">
      <div className="modal-box w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div
          className="flex items-center justify-between p-6 sticky top-0 z-10"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div>
            <h2
              className="font-bold text-lg"
              style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
            >
              Upload lab result
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              {patientName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost p-1.5" disabled={uploading}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Test name *</label>
            <input
              className="input"
              value={form.testName}
              onChange={(e) => setForm((f) => ({ ...f, testName: e.target.value }))}
              placeholder="e.g. Complete Blood Count"
              required
            />
          </div>

          <div>
            <label className="label">Test date *</label>
            <input
              type="date"
              className="input"
              value={form.testDate}
              onChange={(e) => setForm((f) => ({ ...f, testDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Lab name</label>
            <input
              className="input"
              value={form.labName}
              onChange={(e) => setForm((f) => ({ ...f, labName: e.target.value }))}
              placeholder="e.g. Chughtai Lab"
            />
          </div>

          <div>
            <label className="label">Ordering doctor</label>
            <select
              className="input"
              value={form.doctorId}
              onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
            >
              <option value="">— Optional —</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Report file * (PDF or image, max 10MB)</label>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
              style={{
                borderColor: dragOver ? 'var(--brand)' : 'var(--border)',
                background: dragOver ? 'var(--brand-light)' : 'var(--surface-2)',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {!file ? (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={28} style={{ color: 'var(--brand)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    PDF, JPEG, PNG, GIF, WebP
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {isPdf ? (
                    <div className="flex items-center gap-2">
                      <FileText size={40} style={{ color: 'var(--red)' }} />
                      <span className="text-sm font-semibold truncate max-w-[200px]" style={{ color: 'var(--text-1)' }}>
                        {file.name}
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-40 rounded-lg object-contain border"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      )}
                      <p className="text-xs mt-2 truncate max-w-full" style={{ color: 'var(--text-3)' }}>
                        {file.name}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearFile()
                    }}
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input min-h-[72px] resize-y"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Preliminary notes or instructions…"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.isSharedWithPatient}
              onChange={(e) => setForm((f) => ({ ...f, isSharedWithPatient: e.target.checked }))}
            />
            <span style={{ color: 'var(--text-2)' }}>Share with patient in their portal</span>
          </label>

          {uploading && (
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'var(--brand)' }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={uploading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload size={15} /> Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
