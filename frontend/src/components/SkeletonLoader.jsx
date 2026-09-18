import React from 'react'

export default function SkeletonLoader({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card bg-white/[0.03] border-white/[0.05] h-24 rounded-xl" />
      ))}
    </div>
  )
}
