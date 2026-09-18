import React from 'react'
import { FolderOpen } from 'lucide-react'

export default function EmptyState({ 
  icon: Icon = FolderOpen, 
  title = "No data yet", 
  description = "Get started by adding records to HealthIQ.", 
  action, 
  actionLabel = "Add Record" 
}) {
  return (
    <div className="card flex flex-col items-center justify-center p-12 text-center border-dashed border-white/10 bg-surface-200/50 my-4">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 text-brand-400 shadow-inner">
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-stone-100 tracking-tight mb-1.5">{title}</h3>
      <p className="text-sm text-stone-400 max-w-sm leading-relaxed mb-6">{description}</p>
      {action && (
        <button onClick={action} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
