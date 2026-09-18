import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader, FileSearch, ArrowRight, ShieldAlert } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function AddHealthRecords() {
  const navigate = useNavigate()

  // Lab Report Upload State
  const [labFile, setLabFile] = useState(null)
  const [labUploading, setLabUploading] = useState(false)
  const [labStage, setLabStage] = useState('') // 'uploading' | 'text_extraction' | 'biomarker_extraction' | 'done'
  const [labMessage, setLabMessage] = useState(null)
  const [reports, setReports] = useState([])
  const [labDragOver, setLabDragOver] = useState(false)

  // Chest X-Ray Upload State
  const [xrayFile, setXrayFile] = useState(null)
  const [xrayUploading, setXrayUploading] = useState(false)
  const [xrayError, setXrayError] = useState('')
  const [xrayDragOver, setXrayDragOver] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const res = await api.get('/reports/')
      setReports(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleLabUpload = async () => {
    if (!labFile) return
    setLabUploading(true)
    setLabStage('uploading')
    setLabMessage(null)

    const fd = new FormData()
    fd.append('file', labFile)

    try {
      // Simulate workflow stage progress for clear visual feedback
      setTimeout(() => setLabStage('text_extraction'), 800)
      setTimeout(() => setLabStage('biomarker_extraction'), 1600)

      const res = await api.post('/reports/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setLabStage('done')
      setLabMessage({
        type: 'success',
        text: `Report processed! ${res.data.biomarkers_extracted || 0} biomarkers successfully extracted into your health record.`
      })
      setLabFile(null)
      loadReports()
    } catch (e) {
      setLabMessage({
        type: 'error',
        text: e.response?.data?.detail || 'Upload failed. Please ensure file is a clear PDF or image report.'
      })
    } finally {
      setLabUploading(false)
    }
  }

  const handleDeleteReport = async (id) => {
    try {
      await api.delete(`/reports/${id}`)
      loadReports()
    } catch (e) {
      console.error(e)
    }
  }

  const handleXrayAnalyze = async () => {
    if (!xrayFile) return
    setXrayUploading(true)
    setXrayError('')

    const fd = new FormData()
    fd.append('file', xrayFile)

    try {
      const res = await api.post('/xray/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Store analysis result in sessionStorage for the X-Ray Report page
      sessionStorage.setItem('latest_xray_analysis', JSON.stringify({
        filename: xrayFile.name,
        previewUrl: URL.createObjectURL(xrayFile),
        data: res.data
      }))

      // Navigate to Chest X-Ray report page
      navigate('/xray')
    } catch (e) {
      setXrayError(e.response?.data?.detail || 'X-ray analysis failed. Please provide a valid chest X-ray image.')
    } finally {
      setXrayUploading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Add Health Records</h1>
        <p className="text-sm text-stone-400 mt-1">
          Upload laboratory reports or chest X-rays to expand your personal health intelligence timeline.
        </p>
      </div>

      {/* Two Workflows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* WORKFLOW 1: LABORATORY REPORTS */}
        <div className="card space-y-5 bg-[#121520] border-white/[0.08] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Add a laboratory report</h2>
                <p className="text-xs text-stone-400">PDF or Image (CBC, Metabolic Panel, Lipid Profile, etc.)</p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Upload your medical or laboratory report and HealthIQ will organize the available health information and extract biomarkers automatically.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setLabDragOver(true) }}
              onDragLeave={() => setLabDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setLabDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f) setLabFile(f)
              }}
              onClick={() => document.getElementById('lab-file-input').click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                labDragOver
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <Upload className="mx-auto mb-2 text-stone-400" size={28} />
              <p className="text-xs font-semibold text-stone-200">Drag & drop lab report here</p>
              <p className="text-[11px] text-stone-500 mt-1">PDF, PNG, JPG or JPEG up to 25MB</p>
              <input
                id="lab-file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={e => setLabFile(e.target.files[0])}
              />
            </div>

            {/* Selected File Card & Actions */}
            {labFile && (
              <div className="flex items-center justify-between bg-white/[0.04] p-3 rounded-lg border border-white/10">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText size={16} className="text-brand-400 shrink-0" />
                  <span className="text-xs font-medium text-white truncate">{labFile.name}</span>
                </div>
                <button
                  onClick={handleLabUpload}
                  disabled={labUploading}
                  className="btn-primary text-xs py-1.5 px-3 shrink-0"
                >
                  {labUploading ? <Loader size={13} className="animate-spin" /> : 'Upload & Extract'}
                </button>
              </div>
            )}

            {/* Step-by-step Processing Stepper */}
            {labUploading && (
              <div className="bg-surface-300/60 p-4 rounded-xl border border-white/[0.06] space-y-3">
                <div className="text-xs font-mono font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Processing Workflow
                </div>

                <div className="space-y-2 text-xs">
                  <div className={`flex items-center gap-2.5 ${labStage === 'uploading' ? 'text-brand-400 font-semibold' : 'text-emerald-400'}`}>
                    <CheckCircle size={14} />
                    <span>1. Processing file upload...</span>
                  </div>
                  <div className={`flex items-center gap-2.5 ${labStage === 'text_extraction' ? 'text-brand-400 font-semibold animate-pulse' : labStage === 'biomarker_extraction' || labStage === 'done' ? 'text-emerald-400' : 'text-stone-500'}`}>
                    <CheckCircle size={14} />
                    <span>2. Text & OCR extraction...</span>
                  </div>
                  <div className={`flex items-center gap-2.5 ${labStage === 'biomarker_extraction' ? 'text-brand-400 font-semibold animate-pulse' : labStage === 'done' ? 'text-emerald-400' : 'text-stone-500'}`}>
                    <CheckCircle size={14} />
                    <span>3. Biomarker parsing & health record indexing...</span>
                  </div>
                </div>
              </div>
            )}

            {labMessage && (
              <div className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
                labMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}>
                {labMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                <span>{labMessage.text}</span>
              </div>
            )}
          </div>
        </div>


        {/* WORKFLOW 2: CHEST X-RAY */}
        <div className="card space-y-5 bg-[#121520] border-white/[0.08] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <FileSearch size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Add a chest X-ray</h2>
                <p className="text-xs text-stone-400">Radiology DICOM / Chest X-Ray Image</p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Upload a chest X-ray for AI-assisted image analysis powered by deep learning dense convolutional neural networks.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setXrayDragOver(true) }}
              onDragLeave={() => setXrayDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setXrayDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f && f.type.startsWith('image/')) setXrayFile(f)
              }}
              onClick={() => document.getElementById('xray-file-input').click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                xrayDragOver
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <Upload className="mx-auto mb-2 text-stone-400" size={28} />
              <p className="text-xs font-semibold text-stone-200">Drag & drop Chest X-Ray image</p>
              <p className="text-[11px] text-stone-500 mt-1">PNG, JPG or JPEG image format</p>
              <input
                id="xray-file-input"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={e => setXrayFile(e.target.files[0])}
              />
            </div>

            {xrayFile && (
              <div className="flex items-center justify-between bg-white/[0.04] p-3 rounded-lg border border-white/10">
                <div className="flex items-center gap-2.5 truncate">
                  <FileSearch size={16} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-medium text-white truncate">{xrayFile.name}</span>
                </div>
                <button
                  onClick={handleXrayAnalyze}
                  disabled={xrayUploading}
                  className="btn-primary bg-sky-600 hover:bg-sky-500 text-xs py-1.5 px-3 shrink-0"
                >
                  {xrayUploading ? <Loader size={13} className="animate-spin" /> : 'Analyze Chest X-Ray'}
                </button>
              </div>
            )}

            {xrayError && (
              <div className="p-3.5 rounded-lg text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{xrayError}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-[11px] text-stone-400 flex items-center gap-2">
            <ShieldAlert size={14} className="text-stone-400 shrink-0" />
            <span>Support in this version is specifically calibrated for Chest X-Ray imagery.</span>
          </div>
        </div>

      </div>

      {/* Previous Laboratory Reports List */}
      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-white tracking-tight">Previous Reports</h2>

        {reports.length === 0 ? (
          <p className="text-xs text-stone-500 py-4 text-center">No reports uploaded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] hover:border-white/10 p-3.5 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{r.filename}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Uploaded {format(new Date(r.uploaded_at), 'MMM d, yyyy')} · {r.biomarker_count} biomarkers extracted
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteReport(r.id)}
                  className="text-stone-500 hover:text-rose-400 p-2 transition-colors rounded-lg hover:bg-rose-500/10"
                  title="Delete Report"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
