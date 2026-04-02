/**
 * Parse prescription medicine duration strings and compute active status.
 * Supports: "7 days", "1 month", "3 months", "Ongoing", weeks, etc.
 */

function startOfDayUTC(d) {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
}

export function calendarDaysBetween(start, end) {
  return Math.round((startOfDayUTC(end) - startOfDayUTC(start)) / 86400000);
}

function addMonthsUTC(date, months) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * @returns {{ kind: 'ongoing' } | { kind: 'days', totalDays: number } | { kind: 'months', months: number } | { kind: 'unknown' }}
 */
export function parseDurationString(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') {
    return { kind: 'unknown' };
  }
  const s = durationStr.trim().toLowerCase();
  if (
    s === 'ongoing' ||
    s === 'ongoing indefinitely' ||
    s === 'continuous' ||
    s === 'indefinite'
  ) {
    return { kind: 'ongoing' };
  }

  let m = s.match(/^(\d+)\s*days?$/);
  if (m) return { kind: 'days', totalDays: parseInt(m[1], 10) };

  m = s.match(/^(\d+)\s*weeks?$/);
  if (m) return { kind: 'days', totalDays: parseInt(m[1], 10) * 7 };

  m = s.match(/^(\d+)\s*months?$/);
  if (m) return { kind: 'months', months: parseInt(m[1], 10) };

  m = s.match(/(\d+)\s*days?/);
  if (m) return { kind: 'days', totalDays: parseInt(m[1], 10) };

  m = s.match(/(\d+)\s*weeks?/);
  if (m) return { kind: 'days', totalDays: parseInt(m[1], 10) * 7 };

  m = s.match(/(\d+)\s*months?/);
  if (m) return { kind: 'months', months: parseInt(m[1], 10) };

  return { kind: 'unknown' };
}

/**
 * @param {Date|string} prescriptionCreatedAt
 * @param {string} durationStr
 * @returns {{
 *   isActive: boolean,
 *   isOngoing: boolean,
 *   daysRemaining: number | null,
 *   totalDays: number | null,
 * }}
 */
export function evaluateMedicineActive(prescriptionCreatedAt, durationStr) {
  const start = new Date(prescriptionCreatedAt);
  const today = new Date();
  const parsed = parseDurationString(durationStr);

  if (parsed.kind === 'ongoing') {
    return {
      isActive: true,
      isOngoing: true,
      daysRemaining: null,
      totalDays: null,
    };
  }

  if (parsed.kind === 'unknown') {
    return {
      isActive: false,
      isOngoing: false,
      daysRemaining: null,
      totalDays: null,
    };
  }

  let totalDays;
  if (parsed.kind === 'days') {
    totalDays = parsed.totalDays;
  } else {
    const endAnchor = addMonthsUTC(start, parsed.months);
    totalDays = calendarDaysBetween(start, endAnchor);
    if (totalDays < 1) totalDays = 1;
  }

  const daysSince = calendarDaysBetween(start, today);
  const daysRemaining = totalDays - daysSince;

  if (daysSince < 0) {
    return {
      isActive: false,
      isOngoing: false,
      daysRemaining: 0,
      totalDays,
    };
  }

  const isActive = daysRemaining > 0;

  return {
    isActive,
    isOngoing: false,
    daysRemaining: isActive ? Math.max(0, daysRemaining) : 0,
    totalDays,
  };
}

/**
 * @param {Array<object>} prescriptions - Mongoose docs or plain objects with medicines, createdAt, doctor
 * @returns {Array<object>} Active medicine rows for API / reminders
 */
export function buildActiveMedicineList(prescriptions) {
  const out = [];

  for (const rx of prescriptions) {
    const prescribedBy = rx.doctor?.name ? `Dr. ${rx.doctor.name}` : '—';
    const prescriptionDate = rx.createdAt;

    for (const med of rx.medicines || []) {
      const ev = evaluateMedicineActive(prescriptionDate, med.duration);
      if (!ev.isActive) continue;

      out.push({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || '',
        prescribedBy,
        prescriptionDate: prescriptionDate instanceof Date
          ? prescriptionDate.toISOString()
          : prescriptionDate,
        daysRemaining: ev.daysRemaining,
        isOngoing: ev.isOngoing,
        totalDays: ev.totalDays,
      });
    }
  }

  return out;
}
