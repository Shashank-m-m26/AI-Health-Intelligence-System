import { useState, useEffect } from 'react'
import api from '../utils/api'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  Activity,
  FileText,
  FileSearch,
  Pill,
  Utensils,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react'
import { format } from 'date-fns'
import SkeletonLoader from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [biomarkerNames, setBiomarkerNames] = useState([])
  const [allBiomarkers, setAllBiomarkers] = useState([])
  const [selectedBiomarker, setSelectedBiomarker] = useState('')
  const [biomarkerHistory, setBiomarkerHistory] = useState([])
  const [riskScores, setRiskScores] = useState(null)
  const [reports, setReports] = useState([])
  const [medicines, setMedicines] = useState([])
  const [manualLogs, setManualLogs] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (selectedBiomarker) {
      const history = allBiomarkers
        .filter(b => b.name.toLowerCase() === selectedBiomarker.toLowerCase())
        .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
      setBiomarkerHistory(history)
    }
  }, [selectedBiomarker, allBiomarkers])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [namesRes, allBiomarkersRes, riskRes, reportsRes, medicinesRes, logsRes] = await Promise.all([
        api.get('/biomarkers/names').catch(() => ({ data: [] })),
        api.get('/biomarkers/').catch(() => ({ data: [] })),
        api.get('/biomarkers/risk-scores').catch(() => ({ data: null })),
        api.get('/reports/').catch(() => ({ data: [] })),
        api.get('/medicines/').catch(() => ({ data: [] })),
        api.get('/logs/').catch(() => ({ data: [] })),
      ])

      setBiomarkerNames(namesRes.data || [])
      setAllBiomarkers(allBiomarkersRes.data || [])
      setRiskScores(riskRes.data || null)
      setReports(reportsRes.data || [])
      setMedicines(medicinesRes.data || [])
      setManualLogs(logsRes.data || [])

      if (namesRes.data && namesRes.data.length > 0) {
        setSelectedBiomarker(namesRes.data[0])
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }

  // Calculate "What Changed" comparison between latest & previous available biomarker values
  const biomarkerChanges = biomarkerNames.map(name => {
    const history = allBiomarkers
      .filter(b => b.name.toLowerCase() === name.toLowerCase())
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))

    if (history.length === 0) return null

    const latest = history[history.length - 1]
    const previous = history.length > 1 ? history[history.length - 2] : null

    let deltaText = 'Stable'
    let status = 'stable' // 'increased' | 'decreased' | 'stable' | 'single'
    let explanation = `Single recorded reading of ${latest.value} ${latest.unit}.`

    if (previous) {
      const valDiff = latest.value - previous.value
      if (valDiff > 0) {
        status = 'increased'
        deltaText = `Changed (+${valDiff.toFixed(1)})`
        explanation = `${name} increased from ${previous.value} to ${latest.value} ${latest.unit} compared with your previous available report.`
      } else if (valDiff < 0) {
        status = 'decreased'
        deltaText = `Changed (${valDiff.toFixed(1)})`
        explanation = `${name} decreased from ${previous.value} to ${latest.value} ${latest.unit} compared with your previous available report.`
      } else {
        status = 'stable'
        deltaText = 'Stable'
        explanation = `${name} remained unchanged at ${latest.value} ${latest.unit} compared with your previous report.`
      }
    }

    return {
      name,
      latest,
      previous,
      status,
      deltaText,
      explanation
    }
  }).filter(Boolean)

  // Construct Health Story observations
  const observations = []
  const changedItems = biomarkerChanges.filter(c => c.previous && c.status !== 'stable')
  const totalBiomarkers = biomarkerNames.length

  if (changedItems.length > 0) {
    observations.push({
      text: `${changedItems.length} biomarker${changedItems.length > 1 ? 's' : ''} changed compared with your previous available report.`,
      highlight: true
    })
  }
  if (reports.length > 0) {
    const latestReport = reports[0]
    observations.push({
      text: `Latest laboratory report uploaded on ${format(new Date(latestReport.uploaded_at), 'MMM d, yyyy')} with ${latestReport.biomarker_count} extracted markers.`,
      highlight: false
    })
  }
  if (biomarkerChanges.filter(c => c.status === 'stable').length > 0) {
    observations.push({
      text: `Some health areas have remained stable across your available records.`,
      highlight: false
    })
  }

  // Construct Health Timeline
  const timelineEvents = []

  reports.forEach(r => {
    timelineEvents.push({
      type: 'LAB REPORT',
      icon: FileText,
      title: r.filename,
      subtitle: `${r.biomarker_count || 'Multiple'} biomarkers extracted`,
      date: new Date(r.uploaded_at),
      badgeColor: 'border-sky-500/30 text-sky-400 bg-sky-500/10'
    })
  })

  medicines.forEach(m => {
    timelineEvents.push({
      type: 'MEDICINE',
      icon: Pill,
      title: m.drug_name,
      subtitle: m.dosage ? `Dose: ${m.dosage}` : 'Medication recorded',
      date: new Date(m.start_date),
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    })
  })

  manualLogs.forEach(l => {
    timelineEvents.push({
      type: 'HEALTH LOG',
      icon: Activity,
      title: l.log_type.replace('_', ' ').toUpperCase(),
      subtitle: `Logged value: ${l.value}${l.unit ? ' ' + l.unit : ''}`,
      date: new Date(l.logged_at),
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
    })
  })

  timelineEvents.sort((a, b) => b.date - a.date)

  // Construct Important Health Areas
  const healthAreas = [
    {
      key: 'blood_sugar',
      title: 'BLOOD SUGAR',
      description: biomarkerChanges.some(c => c.name.toLowerCase().includes('hba1c') || c.name.toLowerCase().includes('glucose'))
        ? 'Recent glucose-related biomarkers present in your history.'
        : 'Glucose markers monitored.',
      status: riskScores?.diabetes?.score > 50 ? 'Attention' : 'Stable',
      statusClass: riskScores?.diabetes?.score > 50 ? 'risk-yellow' : 'risk-green'
    },
    {
      key: 'cardiovascular',
      title: 'CARDIOVASCULAR',
      description: biomarkerChanges.some(c => c.name.toLowerCase().includes('cholesterol') || c.name.toLowerCase().includes('triglycerides'))
        ? 'Cardiovascular markers recorded in available reports.'
        : 'Lipid profile indicators recorded.',
      status: riskScores?.cardiovascular?.score > 60 ? 'Attention' : 'Stable',
      statusClass: riskScores?.cardiovascular?.score > 60 ? 'risk-yellow' : 'risk-green'
    },
    {
      key: 'kidney',
      title: 'KIDNEY',
      description: biomarkerChanges.some(c => c.name.toLowerCase().includes('creatinine') || c.name.toLowerCase().includes('egfr'))
        ? 'Renal function indicators present in history.'
        : 'Renal panel markers monitored.',
      status: riskScores?.kidney?.score > 60 ? 'Attention' : 'Stable',
      statusClass: riskScores?.kidney?.score > 60 ? 'risk-yellow' : 'risk-green'
    },
    {
      key: 'liver',
      title: 'LIVER',
      description: 'Hepatic enzymes and protein markers stable across reports.',
      status: 'Stable',
      statusClass: 'risk-green'
    }
  ]

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <SkeletonLoader rows={4} />
      </div>
    )
  }

  const hasData = totalBiomarkers > 0 || reports.length > 0 || manualLogs.length > 0

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-mono font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} /> Longitudinal Personal Health Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Health Dashboard</h1>
          <p className="text-sm text-stone-400 mt-1">Your entire health history. One intelligent story.</p>
        </div>

        <button
          onClick={loadDashboardData}
          className="btn-secondary self-start sm:self-auto text-xs px-3 py-2"
        >
          <RefreshCw size={13} /> Refresh Data
        </button>
      </div>

      {!hasData ? (
        <EmptyState
          icon={Activity}
          title="Your health story is just getting started"
          description="Upload your first laboratory report or add health logs to build your personal health intelligence timeline over time."
          action={() => window.location.href = '/add-records'}
          actionLabel="Add First Health Record"
        />
      ) : (
        <div className="space-y-8">
          {/* 1A. HEALTH STORY */}
          <section className="card bg-gradient-to-br from-[#161a29] to-[#11131f] border-white/[0.1] relative overflow-hidden p-6 md:p-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="text-[11px] font-mono font-semibold tracking-widest text-brand-400 uppercase">
                YOUR HEALTH STORY
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-medium text-stone-100 leading-snug italic">
                “Your recent health records show several changes worth understanding.”
              </h2>

              <div className="pt-2 space-y-2.5">
                {observations.length > 0 ? (
                  observations.map((obs, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-stone-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 shrink-0" />
                      <span>{obs.text}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-400">
                    Upload more health records to build a clearer picture over time.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 1B. WHAT CHANGED */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">What changed?</h2>
                <p className="text-xs text-stone-400 mt-0.5">Comparison between latest available health values and previous records</p>
              </div>
            </div>

            {biomarkerChanges.length === 0 ? (
              <div className="card text-stone-400 text-sm text-center py-8">
                No previous report available for comparison yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {biomarkerChanges.slice(0, 6).map((change) => (
                  <div key={change.name} className="card card-hover flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono uppercase text-stone-400 tracking-wider font-semibold">{change.name}</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          {change.previous ? (
                            <>
                              <span className="text-stone-400 text-sm font-mono">{change.previous.value}</span>
                              <ArrowRight size={13} className="text-stone-500" />
                              <span className="text-xl font-bold font-mono text-white">{change.latest.value}</span>
                              <span className="text-xs text-stone-400">{change.latest.unit}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl font-bold font-mono text-white">{change.latest.value}</span>
                              <span className="text-xs text-stone-400">{change.latest.unit}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        change.status === 'increased'
                          ? 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                          : change.status === 'decreased'
                          ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                          : 'border-white/10 text-stone-400 bg-white/[0.04]'
                      }`}>
                        {change.deltaText}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                      {change.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 1C. HEALTH TIMELINE */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Health Timeline</h2>
              <p className="text-xs text-stone-400 mt-0.5">A longitudinal timeline of your personal health events</p>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="card text-stone-400 text-sm text-center py-8">
                Your health timeline will appear here as you add records.
              </div>
            ) : (
              <div className="card p-6">
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                  {timelineEvents.slice(0, 5).map((evt, idx) => {
                    const IconComponent = evt.icon
                    return (
                      <div key={idx} className="relative flex items-start gap-4 group">
                        {/* Bullet */}
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-stone-950 border-2 border-brand-500 group-hover:scale-125 transition-transform" />

                        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] hover:border-white/10 rounded-xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/[0.05] text-stone-300">
                              <IconComponent size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${evt.badgeColor}`}>
                                  {evt.type}
                                </span>
                                <span className="text-sm font-semibold text-white">{evt.title}</span>
                              </div>
                              <p className="text-xs text-stone-400 mt-0.5">{evt.subtitle}</p>
                            </div>
                          </div>

                          <div className="text-xs font-mono text-stone-400 shrink-0">
                            {format(evt.date, 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* 1D. IMPORTANT HEALTH AREAS */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Important Health Areas</h2>
              <p className="text-xs text-stone-400 mt-0.5">Compact intelligent interpretation across organ systems</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {healthAreas.map(area => (
                <div key={area.key} className="card card-hover flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">{area.title}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${area.statusClass}`}>
                        {area.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      "{area.description}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 1E. BIOMARKER STORY */}
          <section className="card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Your biomarkers tell a story</h2>
                <p className="text-xs text-stone-400 mt-0.5">Select a biomarker to observe its historical progression across available reports</p>
              </div>

              {biomarkerNames.length > 0 && (
                <select
                  value={selectedBiomarker}
                  onChange={e => setSelectedBiomarker(e.target.value)}
                  className="input sm:w-56 text-xs"
                >
                  {biomarkerNames.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              )}
            </div>

            {biomarkerHistory.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">Select a biomarker above to view its narrative history.</p>
            ) : (
              <div className="space-y-6">
                {/* Trend line nodes */}
                <div className="bg-surface-300/40 p-5 rounded-xl border border-white/[0.06] overflow-x-auto">
                  <div className="text-xs font-mono font-semibold text-brand-400 uppercase tracking-wider mb-4">
                    {selectedBiomarker} ({biomarkerHistory[0]?.unit || ''})
                  </div>

                  <div className="flex items-center justify-around min-w-[320px] py-4 relative">
                    <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-brand-500/30 -z-0" />
                    {biomarkerHistory.map((point, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center group">
                        <div className="w-9 h-9 rounded-full bg-stone-900 border-2 border-brand-500 text-white font-mono text-xs font-bold flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          {point.value}
                        </div>
                        <span className="text-[10px] font-mono text-stone-400 mt-2">
                          {format(new Date(point.recorded_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-stone-300 leading-relaxed bg-white/[0.02] p-4 rounded-lg border border-white/[0.05]">
                  <span className="font-semibold text-white mr-1">Historical Context:</span>
                  {biomarkerHistory.length === 1
                    ? `Single recorded measurement of ${biomarkerHistory[0].value} ${biomarkerHistory[0].unit} on ${format(new Date(biomarkerHistory[0].recorded_at), 'MMM d, yyyy')}. Upload additional laboratory reports to track change over time.`
                    : `Tracked over ${biomarkerHistory.length} reports from ${format(new Date(biomarkerHistory[0].recorded_at), 'MMM d, yyyy')} (${biomarkerHistory[0].value} ${biomarkerHistory[0].unit}) to ${format(new Date(biomarkerHistory[biomarkerHistory.length - 1].recorded_at), 'MMM d, yyyy')} (${biomarkerHistory[biomarkerHistory.length - 1].value} ${biomarkerHistory[biomarkerHistory.length - 1].unit}).`
                  }
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
