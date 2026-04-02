/**
 * Classify vital values for UI color (green / amber / red).
 * Returns: 'normal' | 'borderline' | 'critical' | 'neutral'
 */

export function getBpLevel(systolic, diastolic) {
  if (systolic == null && diastolic == null) return 'neutral'
  const sys = Number(systolic)
  const dia = Number(diastolic)

  if (Number.isFinite(sys)) {
    if (sys < 90 || sys >= 180) return 'critical'
    if (sys >= 140 || (sys >= 130 && Number.isFinite(dia) && dia >= 90)) return 'critical'
    if (sys >= 120 || sys > 120) return 'borderline'
  }
  if (Number.isFinite(dia)) {
    if (dia < 60 || dia >= 120) return 'critical'
    if (dia >= 90) return 'critical'
    if (dia >= 80) return 'borderline'
  }
  if (Number.isFinite(sys) && sys >= 90 && sys <= 120 && Number.isFinite(dia) && dia >= 60 && dia <= 80) {
    return 'normal'
  }
  if (Number.isFinite(sys) && sys >= 90 && sys <= 120) return 'borderline'
  if (Number.isFinite(dia) && dia >= 60 && dia <= 80) return 'borderline'
  return 'normal'
}

export function getHeartRateLevel(bpm) {
  if (bpm == null || bpm === '') return 'neutral'
  const n = Number(bpm)
  if (!Number.isFinite(n)) return 'neutral'
  if (n < 50 || n > 120) return 'critical'
  if (n < 60 || n > 100) return 'borderline'
  return 'normal'
}

export function getTemperatureLevel(c) {
  if (c == null || c === '') return 'neutral'
  const n = Number(c)
  if (!Number.isFinite(n)) return 'neutral'
  if (n < 35 || n >= 39.5) return 'critical'
  if (n < 36.1 || n > 37.2) return 'borderline'
  return 'normal'
}

export function getSpO2Level(pct) {
  if (pct == null || pct === '') return 'neutral'
  const n = Number(pct)
  if (!Number.isFinite(n)) return 'neutral'
  if (n < 90) return 'critical'
  if (n < 95) return 'borderline'
  return 'normal'
}

export function getGlucoseLevel(mgDl) {
  if (mgDl == null || mgDl === '') return 'neutral'
  const n = Number(mgDl)
  if (!Number.isFinite(n)) return 'neutral'
  if (n < 54 || n > 400) return 'critical'
  if (n < 70 || n > 140) return 'borderline'
  return 'normal'
}

export function getWeightLevel() {
  return 'neutral'
}

export function levelToStyle(level) {
  if (level === 'neutral') {
    return {
      borderColor: 'var(--border)',
      background: 'var(--surface-2)',
      color: 'var(--text-3)',
    }
  }
  switch (level) {
    case 'normal':
      return {
        borderColor: 'rgba(21,128,61,0.45)',
        background: 'rgba(220,252,231,0.35)',
        color: '#15803d',
      }
    case 'borderline':
      return {
        borderColor: 'rgba(180,83,9,0.45)',
        background: 'rgba(254,243,199,0.45)',
        color: '#b45309',
      }
    case 'critical':
      return {
        borderColor: 'rgba(220,38,38,0.45)',
        background: 'rgba(254,226,226,0.45)',
        color: '#b91c1c',
      }
    default:
      return {
        borderColor: 'var(--border)',
        background: 'var(--surface)',
        color: 'var(--text-2)',
      }
  }
}
