import { useState, useEffect } from 'react'
import api from '../utils/api'
import {
  FileSearch,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Loader,
  Eye,
  Info,
  Layers,
  Activity
} from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function XRayReport() {
  const [analysisData, setAnalysisData] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [filename, setFilename] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showTechnical, setShowTechnical] = useState(false)

  useEffect(() => {
    // Check if session storage has recent analysis from Add Records
    const saved = sessionStorage.getItem('latest_xray_analysis')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAnalysisData(parsed.data)
        setPreviewUrl(parsed.previewUrl)
        setFilename(parsed.filename)
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError('')
    setFilename(file.name)

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await api.post('/xray/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAnalysisData(res.data)

      sessionStorage.setItem('latest_xray_analysis', JSON.stringify({
        filename: file.name,
        previewUrl: objectUrl,
        data: res.data
      }))
    } catch (err) {
      setError(err.response?.data?.detail || 'X-ray analysis failed. Ensure the uploaded file is a valid chest X-ray image.')
    } finally {
      setUploading(false)
    }
  }

  // Group observations by category (Lungs, Cardiac, Pleura, Other)
  const groupedObservations = {
    Lungs: [],
    Cardiac: [],
    Pleura: [],
    Other: []
  }

  if (analysisData?.observations) {
    analysisData.observations.forEach(obs => {
      const cat = obs.category || 'Other'
      if (!groupedObservations[cat]) {
        groupedObservations[cat] = []
      }
      groupedObservations[cat].push(obs)
    })
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-medium tracking-wider uppercase mb-1">
            <FileSearch size={14} /> Medical Imaging Workspace
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Chest X-Ray Analysis</h1>
          <p className="text-sm text-stone-400 mt-1">
            AI-assisted computer vision assessment strictly calibrated for chest radiographs.
          </p>
        </div>

        <div>
          <label className="btn-primary bg-sky-600 hover:bg-sky-500 text-xs px-3.5 py-2 cursor-pointer inline-flex items-center gap-2">
            <Upload size={14} /> Upload Chest X-Ray
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-300/90 leading-relaxed">
        <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300 mr-1">Medical Research Disclaimer:</span>
          AI-assisted analysis is provided for informational and research purposes only and is not a medical diagnosis. Model outputs represent algorithmic pattern detection and must be verified by a qualified healthcare professional.
        </div>
      </div>

      {uploading ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center space-y-4">
          <Loader size={32} className="animate-spin text-sky-400" />
          <p className="text-sm text-stone-200 font-medium">Running TorchXRayVision DenseNet121 Neural Network...</p>
          <p className="text-xs text-stone-400">Evaluating 18 radiological pathology features on chest X-ray image</p>
        </div>
      ) : error ? (
        <div className="card p-6 border-rose-500/30 bg-rose-500/5 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : !analysisData ? (
        <EmptyState
          icon={FileSearch}
          title="No chest X-ray records yet"
          description="Upload a chest X-ray image to begin an AI-assisted analysis using pretrained deep learning models."
          action={() => document.querySelector('input[type="file"]')?.click()}
          actionLabel="Upload Chest X-Ray Image"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Workspace Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-4 bg-[#0d0f17] border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                <span className="truncate max-w-[200px]">{filename || 'Chest X-Ray Image'}</span>
                <span className="text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">PA View</span>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black aspect-square flex items-center justify-center group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Chest X-Ray Preview"
                    className="max-h-full max-w-full object-contain filter grayscale contrast-125"
                  />
                ) : (
                  <div className="text-stone-500 text-xs flex flex-col items-center gap-2">
                    <FileSearch size={32} />
                    <span>Image Preview</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-[10px] text-stone-300 font-mono">
                  Normalized Gray Scale • 224x224 DenseNet Input
                </div>
              </div>

              <div className="text-[11px] text-stone-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                Model Architecture: <span className="font-mono text-stone-200">{analysisData.model || 'DenseNet121'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: AI-Assisted Observations */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overall Summary Card */}
            <div className="card bg-gradient-to-r from-surface-100 to-surface-200 border-white/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-stone-400 uppercase tracking-wider">Overall Model Assessment</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  analysisData.summary?.status === 'attention'
                    ? 'risk-yellow'
                    : 'risk-green'
                }`}>
                  {analysisData.summary?.status === 'attention' ? 'Attention Suggested' : 'Normal / Low Scores'}
                </span>
              </div>
              <p className="text-sm text-stone-200 leading-relaxed font-medium">
                {analysisData.summary?.text}
              </p>
            </div>

            {/* Grouped Observations */}
            <div className="space-y-5">
              <h2 className="text-sm font-mono font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <Layers size={15} className="text-sky-400" /> AI-Assisted Observations
              </h2>

              {Object.entries(groupedObservations).map(([category, items]) => {
                if (items.length === 0) return null
                return (
                  <div key={category} className="space-y-3">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider pl-1 border-l-2 border-sky-400">
                      {category} ({items.length})
                    </div>

                    <div className="space-y-2.5">
                      {items.map((obs, idx) => (
                        <div
                          key={idx}
                          className="card card-hover p-4 border-white/[0.06] flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-sm font-semibold text-white">{obs.name}</span>
                              <span className="text-[10px] font-mono text-stone-500 ml-2">({obs.technical_name})</span>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              obs.level === 'high'
                                ? 'risk-red'
                                : obs.level === 'moderate'
                                ? 'risk-yellow'
                                : 'risk-green'
                            }`}>
                              {obs.interpretation}
                            </span>
                          </div>

                          <p className="text-xs text-stone-400 leading-relaxed">
                            {obs.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Collapsible Technical Analysis Section */}
            <div className="pt-2">
              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className="btn-secondary w-full justify-between text-xs py-2.5"
              >
                <span className="flex items-center gap-2 font-mono">
                  <Activity size={14} className="text-sky-400" /> View Technical Analysis (Model Probability Scores)
                </span>
                {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showTechnical && (
                <div className="card mt-3 p-4 bg-[#090b10] border-white/10 space-y-3">
                  <p className="text-xs text-stone-400">
                    Raw uncalibrated pathology prediction outputs from TorchXRayVision DenseNet model across 18 pathologies:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    {analysisData.technical_scores && Object.entries(analysisData.technical_scores).map(([pathology, score]) => (
                      <div key={pathology} className="bg-white/[0.03] p-2.5 rounded border border-white/[0.05] flex items-center justify-between">
                        <span className="text-[11px] text-stone-300 font-mono truncate">{pathology}</span>
                        <span className="text-xs font-mono font-bold text-sky-400 ml-2">{(score * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
