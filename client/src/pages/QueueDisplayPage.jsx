import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Stethoscope } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function QueueDisplayPage() {
  const [searchParams] = useSearchParams()
  const clinicId = searchParams.get('clinicId') || ''
  const dateParam = searchParams.get('date') || ''

  const dateStr = useMemo(() => {
    if (dateParam) return dateParam.slice(0, 10)
    return format(new Date(), 'yyyy-MM-dd')
  }, [dateParam])

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ['appointmentQueue', clinicId, dateStr],
    enabled: Boolean(clinicId),
    queryFn: async () => {
      const params = new URLSearchParams({ clinicId, date: dateStr })
      const res = await fetch(`${API_BASE}/appointments/queue?${params}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.message || 'Could not load queue')
      }
      return json
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const displayDate = useMemo(() => {
    try {
      return format(new Date(dateStr + 'T12:00:00'), 'EEEE, MMMM d, yyyy')
    } catch {
      return dateStr
    }
  }, [dateStr])

  const timeStr = format(now, 'HH:mm:ss')
  const shortDate = format(now, 'dd MMM yyyy')

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col overflow-hidden"
      style={{
        background: '#0A1628',
        color: 'var(--surface)',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* Top bar */}
      <header
        className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center px-4 sm:px-8 py-5 sm:py-6 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            <Stethoscope className="text-white w-8 h-8 sm:w-9 sm:h-9" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p
              className="text-white font-extrabold tracking-tight text-2xl sm:text-3xl md:text-4xl truncate"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}
            >
              MedFlow
            </p>
            <p
              className="text-lg sm:text-xl md:text-2xl font-semibold truncate mt-0.5"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {data?.clinicName || 'Clinic'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-3">
          <span
            className="inline-flex items-center justify-center sm:justify-end gap-2 px-3 py-1.5 rounded-full text-sm font-semibold self-end"
            style={{
              background: 'rgba(0,200,150,0.12)',
              color: 'var(--brand)',
              border: '1px solid rgba(0,200,150,0.35)',
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
              style={{
                background: 'var(--brand)',
                boxShadow: '0 0 12px var(--brand)',
              }}
            />
            Live
          </span>
          <div className="text-right">
            <p
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tabular-nums leading-none"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--brand)',
                textShadow: '0 0 40px rgba(0,200,150,0.25)',
              }}
            >
              {timeStr}
            </p>
            <p className="text-base sm:text-lg mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {shortDate}
            </p>
            <p className="text-sm sm:text-base mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {displayDate}
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col px-4 sm:px-8 py-6 sm:py-10 min-h-0 overflow-y-auto">
        {!clinicId ? (
          <div
            className="flex-1 flex items-center justify-center rounded-3xl border p-8 text-center max-w-2xl mx-auto w-full"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
          >
            <div>
              <p
                className="text-2xl sm:text-3xl font-bold mb-3"
                style={{ fontFamily: 'Outfit, sans-serif', color: 'rgba(255,255,255,0.9)' }}
              >
                Queue display needs a clinic
              </p>
              <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Open this page with <code style={{ color: 'var(--brand)' }}>?clinicId=CLINIC_ID</code> in the URL.
                Use the &quot;Queue Display&quot; button on the reception desk.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center text-center px-4">
            <p className="text-xl sm:text-2xl font-semibold" style={{ color: '#fca5a5' }}>
              {error?.message || 'Something went wrong'}
            </p>
          </div>
        ) : (
          <>
            <section className="flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full">
              <p
                className="text-center text-sm sm:text-base font-bold uppercase tracking-[0.2em] mb-4 sm:mb-6"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Now with doctor
              </p>

              <div
                className="rounded-3xl p-6 sm:p-10 md:p-12 border-2 text-center"
                style={{
                  borderColor: 'rgba(0,200,150,0.45)',
                  background: 'linear-gradient(165deg, rgba(0,200,150,0.12) 0%, rgba(10,22,40,0.9) 100%)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset',
                }}
              >
                {data?.currentlyWith ? (
                  <>
                    <p
                      className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-4 sm:mb-6 break-words"
                      style={{
                        fontFamily: 'Outfit, sans-serif',
                        color: '#fff',
                        letterSpacing: '-0.03em',
                        lineHeight: 1.05,
                      }}
                    >
                      {data.currentlyWith.patientFirstName}
                    </p>
                    <p
                      className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2"
                      style={{ color: 'rgba(255,255,255,0.9)' }}
                    >
                      {data.currentlyWith.doctorName}
                    </p>
                    <p
                      className="text-xl sm:text-2xl md:text-3xl font-medium"
                      style={{ color: 'var(--brand)' }}
                    >
                      {data.currentlyWith.consultationRoom}
                    </p>
                    <p className="text-lg sm:text-xl mt-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {data.currentlyWith.timeSlot}
                    </p>
                  </>
                ) : (
                  <p
                    className="text-3xl sm:text-4xl md:text-5xl font-bold py-4"
                    style={{ fontFamily: 'Outfit, sans-serif', color: 'rgba(255,255,255,0.45)' }}
                  >
                    Waiting for next patient
                  </p>
                )}
              </div>
            </section>

            <section className="max-w-6xl mx-auto w-full mt-8 sm:mt-12">
              <p
                className="text-sm sm:text-base font-bold uppercase tracking-[0.2em] mb-4 sm:mb-6"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Up next
              </p>
              <ol className="space-y-3 sm:space-y-4">
                {[0, 1, 2].map((i) => {
                  const item = data?.upNext?.[i]
                  return (
                    <li
                      key={item?._id || `slot-${i}`}
                      className="flex items-center gap-4 sm:gap-6 rounded-2xl px-4 sm:px-8 py-4 sm:py-5 border"
                      style={{
                        borderColor: 'rgba(255,255,255,0.08)',
                        background: item ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <span
                        className="text-3xl sm:text-4xl md:text-5xl font-black w-14 sm:w-20 flex-shrink-0 tabular-nums"
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          color: item ? 'var(--brand)' : 'rgba(255,255,255,0.12)',
                        }}
                      >
                        {i + 1}
                      </span>
                      {item ? (
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6">
                          <div className="min-w-0">
                            <p
                              className="text-2xl sm:text-3xl md:text-4xl font-bold truncate"
                              style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}
                            >
                              {item.patientFirstName}
                            </p>
                            <p className="text-lg sm:text-xl mt-1 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              {item.doctorName}
                            </p>
                          </div>
                          <p
                            className="text-xl sm:text-2xl font-semibold flex-shrink-0 sm:text-right"
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              color: 'rgba(255,255,255,0.85)',
                            }}
                          >
                            {item.timeSlot?.split(' - ')[0] || item.timeSlot}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xl sm:text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          —
                        </p>
                      )}
                    </li>
                  )
                })}
              </ol>
            </section>
          </>
        )}
      </main>

      {/* Bottom stats */}
      {clinicId && !isLoading && !isError && data && (
        <footer
          className="flex-shrink-0 px-4 sm:px-8 py-5 sm:py-6 border-t flex flex-col lg:flex-row flex-wrap justify-center lg:justify-between items-center gap-6 lg:gap-4"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14">
            <StatPill label="Waiting" value={data.waiting} accent="var(--amber)" />
            <span className="hidden sm:block w-px h-10" style={{ background: 'rgba(255,255,255,0.12)' }} aria-hidden />
            <StatPill label="Completed" value={data.completed} accent="var(--brand)" />
            <span className="hidden sm:block w-px h-10" style={{ background: 'rgba(255,255,255,0.12)' }} aria-hidden />
            <StatPill label="Total today" value={data.totalToday} accent="rgba(255,255,255,0.95)" />
          </div>
          {dataUpdatedAt ? (
            <p className="text-sm text-center lg:text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Data updated {format(new Date(dataUpdatedAt), 'HH:mm:ss')}
            </p>
          ) : null}
        </footer>
      )}
    </div>
  )
}

function StatPill({ label, value, accent }) {
  return (
    <div className="flex items-baseline gap-3 sm:gap-4">
      <span className="text-lg sm:text-xl font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </span>
      <span
        className="text-4xl sm:text-5xl font-black tabular-nums"
        style={{ fontFamily: 'Outfit, sans-serif', color: accent }}
      >
        {value}
      </span>
    </div>
  )
}
