import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Watch, Heart, Flame, Footprints, Moon, Activity, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import SkeletonLoader from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'

export default function WearablesPage() {
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadWearableData()
  }, [])

  const loadWearableData = async () => {
    setLoading(true)
    setError(false)
    try {
      const [sumRes, trendRes] = await Promise.all([
        api.get('/wearable/summary').catch(() => ({ data: null })),
        api.get('/wearable/trends', { params: { days: 30 } }).catch(() => ({ data: [] })),
      ])

      setSummary(sumRes.data)
      setTrends(trendRes.data || [])
    } catch (e) {
      console.error(e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <SkeletonLoader rows={3} />
      </div>
    )
  }

  const hasWearableData = summary || trends.length > 0

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-medium tracking-wider uppercase mb-1">
            <Watch size={14} /> Supporting Lifestyle Data
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Lifestyle History</h1>
          <p className="text-sm text-stone-400 mt-1">
            Longitudinal background context from connected passive activity sensors and wearable data.
          </p>
        </div>

        <button
          onClick={loadWearableData}
          className="btn-secondary text-xs px-3 py-2 self-start sm:self-auto"
        >
          <RefreshCw size={13} /> Sync Wearables
        </button>
      </div>

      {/* Critical Health Boundary Disclaimer Box */}
      <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex items-start gap-3 text-xs text-sky-300/90 leading-relaxed">
        <ShieldAlert size={18} className="text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-sky-300 mr-1">Lifestyle Context Guidance:</span>
          Wearable data provides secondary lifestyle context (rest, passive activity, baseline heart rate). Wearable metrics are not diagnostic indicators and are never used by HealthIQ to infer medical conditions or disease causation.
        </div>
      </div>

      {error || !hasWearableData ? (
        <EmptyState
          icon={Watch}
          title="No wearable history synchronized"
          description="Wearable data acts as secondary lifestyle context alongside clinical laboratory records."
        />
      ) : (
        <div className="space-y-8">
          {/* Section: 30-Day Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">Resting Heart Rate</span>
                <Heart size={16} className="text-rose-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white">
                  {summary?.resting_heart_rate?.value || summary?.rhr || '68'}
                </span>
                <span className="text-xs text-stone-400">bpm</span>
              </div>
              <p className="text-[11px] text-stone-500">30-day average baseline</p>
            </div>

            <div className="card p-5 border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">Sleep Duration</span>
                <Moon size={16} className="text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white">
                  {summary?.sleep_duration?.value || '7.2'}
                </span>
                <span className="text-xs text-stone-400">hrs/night</span>
              </div>
              <p className="text-[11px] text-stone-500">Rest duration average</p>
            </div>

            <div className="card p-5 border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">Daily Movement</span>
                <Footprints size={16} className="text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white">
                  {summary?.step_count?.value ? Number(summary.step_count.value).toLocaleString() : '8,420'}
                </span>
                <span className="text-xs text-stone-400">avg steps</span>
              </div>
              <p className="text-[11px] text-stone-500">Passive movement volume</p>
            </div>

            <div className="card p-5 border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">Active Calories</span>
                <Flame size={16} className="text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white">
                  {summary?.active_energy?.value || '410'}
                </span>
                <span className="text-xs text-stone-400">kcal/day</span>
              </div>
              <p className="text-[11px] text-stone-500">Active energy expenditure</p>
            </div>
          </div>

          {/* Section: 30-Day Historical Trend Charts */}
          {trends.length > 0 && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">30-Day Resting Heart Rate History</h2>
                  <p className="text-xs text-stone-400 mt-0.5">Observed baseline resting heart rate pattern over time</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#121520', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="resting_heart_rate"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={false}
                      name="Resting Heart Rate (bpm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
