import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = '#00C896', trend, accent }) {
  const isPositive = trend > 0
  const isNeutral = trend === 0 || trend === undefined

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-3)', letterSpacing: '0.08em' }}>
          {title}
        </p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}15` }}>
            <Icon size={17} style={{ color }} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold leading-none mb-1"
            style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{subtitle}</p>
          )}
        </div>

        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg`}
            style={{
              background: isNeutral ? 'var(--surface-3)' : isPositive ? '#dcfce7' : '#fee2e2',
              color: isNeutral ? 'var(--text-3)' : isPositive ? '#15803d' : '#dc2626',
            }}>
            {isNeutral ? <Minus size={11} /> : isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Bottom accent bar */}
      <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: '100%', background: `linear-gradient(90deg, ${color}40, ${color})` }} />
      </div>
    </div>
  )
}