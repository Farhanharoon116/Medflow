import { format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const BRAND = '#00C896'
const NAVY = '#3b82f6'

function SparkBlock({ title, children }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
      <p
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ fontFamily: 'Outfit', color: 'var(--text-3)' }}
      >
        {title}
      </p>
      <div style={{ height: 80 }}>{children}</div>
    </div>
  )
}

/**
 * @param {Array} vitals — from API, sorted newest first
 */
export default function VitalsChart({ vitals = [] }) {
  const last10 = vitals.slice(0, 10)
  const chronological = [...last10].reverse()

  const bpData = chronological
    .filter(
      (v) =>
        v.bloodPressure?.systolic != null &&
        v.bloodPressure?.diastolic != null
    )
    .map((v, i) => ({
      i: i + 1,
      label: v.recordedAt ? format(new Date(v.recordedAt), 'MMM d HH:mm') : `${i + 1}`,
      sys: v.bloodPressure.systolic,
      dia: v.bloodPressure.diastolic,
    }))

  const weightData = chronological
    .filter((v) => v.weight != null)
    .map((v, i) => ({
      i: i + 1,
      label: v.recordedAt ? format(new Date(v.recordedAt), 'MMM d') : `${i + 1}`,
      w: v.weight,
    }))

  const tempData = chronological
    .filter((v) => v.temperature != null)
    .map((v, i) => ({
      i: i + 1,
      label: v.recordedAt ? format(new Date(v.recordedAt), 'MMM d') : `${i + 1}`,
      t: v.temperature,
    }))

  const tipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 11,
    padding: '6px 10px',
  }

  const empty = (
    <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--text-4)' }}>
      No data
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SparkBlock title="Blood pressure (last 10)">
        {bpData.length === 0 ? (
          empty
        ) : (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={bpData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" hide tick={{ fontSize: 9 }} />
              <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip contentStyle={tipStyle} />
              <Line type="monotone" dataKey="sys" stroke={BRAND} strokeWidth={2} dot={false} name="Sys" />
              <Line type="monotone" dataKey="dia" stroke={NAVY} strokeWidth={2} dot={false} name="Dia" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SparkBlock>

      <SparkBlock title="Weight (kg)">
        {weightData.length === 0 ? (
          empty
        ) : (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={weightData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={tipStyle} />
              <Line type="monotone" dataKey="w" stroke={BRAND} strokeWidth={2} dot={{ r: 2 }} name="kg" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SparkBlock>

      <SparkBlock title="Temperature (°C)">
        {tempData.length === 0 ? (
          empty
        ) : (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={tempData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={['dataMin - 0.3', 'dataMax + 0.3']} />
              <Tooltip contentStyle={tipStyle} />
              <Line type="monotone" dataKey="t" stroke={BRAND} strokeWidth={2} dot={{ r: 2 }} name="°C" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SparkBlock>
    </div>
  )
}
