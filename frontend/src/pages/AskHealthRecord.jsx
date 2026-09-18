import { useState, useRef, useEffect } from 'react'
import api from '../utils/api'
import {
  MessageSquareQuote,
  Send,
  Loader,
  Stethoscope,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  "What changed in my latest report?",
  "Explain my HbA1c history.",
  "Show me my health history.",
  "What reports do I have?",
  "Explain this result.",
  "What medications are currently recorded?",
]

export default function AskHealthRecord() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to Ask Your Health Record. You can query your indexed health reports, biomarker history, and medication records in simple language.\n\n⚠️ Answers are derived from your recorded history for informational purposes."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [doctorMode, setDoctorMode] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (textToSubmit) => {
    const q = textToSubmit || input.trim()
    if (!q) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await api.post('/chat/', {
        message: q,
        doctor_mode: doctorMode
      })

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }])
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while querying your health record. Please verify your connection or try again.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-mono font-medium tracking-wider uppercase mb-1">
            <MessageSquareQuote size={14} /> Personal Health History Query Engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ask Your Health Record</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Query your indexed laboratory reports, longitudinal biomarker trends, and medical records.
          </p>
        </div>

        <button
          onClick={() => setDoctorMode(!doctorMode)}
          className={`text-xs px-3.5 py-2 rounded-lg border font-mono transition-all flex items-center gap-2 self-start sm:self-auto ${
            doctorMode
              ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 font-semibold shadow-sm'
              : 'bg-white/[0.04] border-white/10 text-stone-400 hover:text-white'
          }`}
        >
          <Stethoscope size={14} /> Doctor Mode {doctorMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Suggested Questions Chips */}
      <div className="shrink-0 space-y-2">
        <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">Suggested Questions:</span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-xs text-stone-300 bg-white/[0.03] border border-white/[0.08] hover:border-brand-500/40 hover:text-white rounded-lg px-3 py-1.5 transition-all text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread Window */}
      <div className="card flex-1 overflow-y-auto p-5 space-y-5 bg-[#0e1018] border-white/[0.08]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                <Bot size={16} />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-brand-500 text-white font-medium rounded-tr-none shadow-glow-brand'
                  : 'bg-white/[0.04] text-stone-100 border border-white/[0.07] rounded-tl-none'
              }`}
            >
              {m.content}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-stone-300 shrink-0 mt-0.5">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-xs text-stone-400">
              <Loader size={14} className="animate-spin text-brand-400" />
              <span>Searching health history records...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend() }}
        className="flex items-center gap-3 shrink-0"
      >
        <input
          className="input flex-1 py-3 px-4 text-xs font-sans"
          placeholder="Ask questions about your health history, lab trends, or medications..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary py-3 px-5 text-xs shrink-0"
        >
          <Send size={15} /> Ask
        </button>
      </form>
    </div>
  )
}
