import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Plus, Trash2, Pill, Clock, Calendar, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import EmptyState from '../components/EmptyState'

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    drug_name: '',
    dosage: '',
    start_date: '',
    end_date: '',
    notes: ''
  })

  useEffect(() => {
    loadMedicines()
  }, [])

  const loadMedicines = async () => {
    setLoading(true)
    try {
      const res = await api.get('/medicines/')
      setMedicines(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedicine = async (e) => {
    e.preventDefault()
    if (!form.drug_name || !form.start_date) return

    setSaving(true)
    try {
      await api.post('/medicines/', {
        drug_name: form.drug_name,
        dosage: form.dosage || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        notes: form.notes || null,
      })

      setForm({ drug_name: '', dosage: '', start_date: '', end_date: '', notes: '' })
      setShowAddModal(false)
      loadMedicines()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMedicine = async (id) => {
    try {
      await api.delete(`/medicines/${id}`)
      loadMedicines()
    } catch (e) {
      console.error(e)
    }
  }

  const isMedActive = (med) => !med.end_date || new Date(med.end_date) >= new Date()

  const activeMedicines = medicines.filter(isMedActive)
  const pastMedicines = medicines.filter(m => !isMedActive(m))

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-mono font-medium tracking-wider uppercase mb-1">
            <Pill size={14} /> Personal Medication Record
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Medicines</h1>
          <p className="text-sm text-stone-400 mt-1">
            Track active treatments and historical medication timelines.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
        >
          <Plus size={15} /> Add Medication Record
        </button>
      </div>

      {medicines.length === 0 && !loading ? (
        <EmptyState
          icon={Pill}
          title="No medication history recorded"
          description="Keep a clean record of your active prescriptions and past treatments over time."
          action={() => setShowAddModal(true)}
          actionLabel="Add First Medication"
        />
      ) : (
        <div className="space-y-8">
          {/* Section: ACTIVE MEDICATIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-mono font-bold text-white uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE MEDICATIONS ({activeMedicines.length})
            </div>

            {activeMedicines.length === 0 ? (
              <div className="card text-xs text-stone-500 py-6 text-center">
                No active medications currently recorded.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMedicines.map(med => (
                  <div key={med.id} className="card card-hover p-5 border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Pill size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{med.drug_name}</h3>
                          {med.dosage && <p className="text-xs text-stone-300 font-mono mt-0.5">{med.dosage}</p>}
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full risk-green uppercase tracking-wider">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-400 border-t border-white/[0.06] pt-3 font-mono">
                      <span>Started: {format(new Date(med.start_date), 'MMM d, yyyy')}</span>
                      <button
                        onClick={() => handleDeleteMedicine(med.id)}
                        className="text-stone-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {med.notes && (
                      <div className="text-xs text-stone-300 bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                        <span className="text-stone-400 font-semibold mr-1">Notes:</span> {med.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: PAST MEDICATION HISTORY */}
          {pastMedicines.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-mono font-bold text-stone-400 uppercase tracking-wider">
                MEDICATION HISTORY ({pastMedicines.length})
              </div>

              <div className="space-y-3">
                {pastMedicines.map(med => (
                  <div key={med.id} className="card p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/[0.05] text-stone-400">
                        <Pill size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-stone-200">{med.drug_name}</span>
                          {med.dosage && <span className="text-xs text-stone-400 font-mono">({med.dosage})</span>}
                        </div>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">
                          {format(new Date(med.start_date), 'MMM d, yyyy')} → {med.end_date ? format(new Date(med.end_date), 'MMM d, yyyy') : 'Stopped'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.05] text-stone-400 border border-white/10 uppercase">
                        Completed
                      </span>
                      <button
                        onClick={() => handleDeleteMedicine(med.id)}
                        className="text-stone-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full bg-[#121520] border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
              <h2 className="text-base font-bold text-white">Add Medication Record</h2>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div>
                <label className="label">Drug / Medication Name *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Metformin, Atorvastatin"
                  value={form.drug_name}
                  onChange={e => setForm({ ...form, drug_name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Dosage & Frequency</label>
                <input
                  className="input"
                  placeholder="e.g. 500mg twice daily with meals"
                  value={form.dosage}
                  onChange={e => setForm({ ...form, dosage: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    required
                    type="date"
                    className="input font-mono text-xs"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End Date (Optional)</label>
                  <input
                    type="date"
                    className="input font-mono text-xs"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes / Instructions</label>
                <textarea
                  rows={2}
                  className="input"
                  placeholder="Additional prescribing instructions or notes..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs"
                >
                  {saving ? 'Saving...' : 'Save Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
