import { format } from 'date-fns'
import { FileText, ExternalLink, Trash2 } from 'lucide-react'

const STATUS_BADGE = {
  'pending-review': 'badge-gray',
  reviewed: 'badge-info',
  normal: 'badge-success',
  abnormal: 'badge-danger',
}

const STATUS_LABEL = {
  'pending-review': 'Pending review',
  reviewed: 'Reviewed',
  normal: 'Normal',
  abnormal: 'Abnormal',
}

export default function LabResultCard({
  lab,
  canDelete,
  canUpdateStatus,
  onDelete,
  onStatusChange,
}) {
  return (
    <div
      className="card p-0 overflow-hidden stagger-item"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4
              className="font-bold text-base leading-tight"
              style={{ fontFamily: 'Outfit', color: 'var(--text-1)' }}
            >
              {lab.testName}
            </h4>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
              {format(new Date(lab.testDate), 'dd MMM yyyy')}
              {lab.labName && (
                <>
                  {' '}
                  · {lab.labName}
                </>
              )}
            </p>
            {lab.doctor?.name && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                Ordered by Dr. {lab.doctor.name}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canUpdateStatus ? (
              <select
                className="input text-xs py-1.5 max-w-[140px]"
                value={lab.status}
                onChange={(e) => onStatusChange?.(lab._id, e.target.value)}
              >
                <option value="pending-review">Pending review</option>
                <option value="reviewed">Reviewed</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
              </select>
            ) : (
              <span className={STATUS_BADGE[lab.status] || 'badge-gray'}>
                {STATUS_LABEL[lab.status] || lab.status}
              </span>
            )}
          </div>
        </div>

        {lab.notes && (
          <div
            className="mt-4 p-3 rounded-xl text-sm"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              Notes
            </span>
            <p className="mt-1 whitespace-pre-wrap">{lab.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <a
            href={lab.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 text-sm py-2"
          >
            {lab.fileType === 'pdf' ? <FileText size={15} /> : <ExternalLink size={15} />}
            {lab.fileType === 'pdf' ? 'View / Download PDF' : 'View / Download'}
          </a>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete?.(lab._id)}
              className="btn-danger inline-flex items-center gap-2 text-sm py-2"
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
