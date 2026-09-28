import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'

// mode: 'fridge' | 'shopping'
export default function AddProductPage({ mode = 'fridge', onClose, onAdd }) {
  const { categories, history, addCategory } = useStore()
  const [name, setName]               = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAddCat, setShowAddCat]   = useState(false)
  const [newEmoji, setNewEmoji]       = useState('')
  const [newLabel, setNewLabel]       = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    // Small delay so the sheet animation finishes before focusing
    const t = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  const suggestions = name.trim().length > 0
    ? history.filter(h => h.name.toLowerCase().includes(name.toLowerCase()))
    : []

  function pickSuggestion(item) {
    setName(item.name)
    setSelectedCat(item.category ?? null)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  function handleAddCategory() {
    const label = newLabel.trim()
    if (!label) return
    addCategory(newEmoji.trim() || '📦', label)
    setNewEmoji('')
    setNewLabel('')
    setShowAddCat(false)
  }

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, selectedCat)
    onClose()
  }

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const selectedCatObj = selectedCat ? catMap[selectedCat] : null
  const canSave = name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl max-h-[92vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0 border-b border-slate-100">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="font-semibold text-slate-800 text-base">
            {mode === 'fridge' ? 'Добавить продукт' : 'Добавить в список'}
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Name input */}
          <div className="px-4 pt-4 pb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Название
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                value={name}
                onChange={e => { setName(e.target.value); setShowSuggestions(true) }}
                onKeyDown={e => e.key === 'Enter' && canSave && handleSave()}
                placeholder="Например: Молоко"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
              />
              {name && (
                <button
                  onClick={() => { setName(''); setShowSuggestions(false); inputRef.current?.focus() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                {suggestions.slice(0, 5).map(item => {
                  const cat = item.category ? catMap[item.category] : null
                  return (
                    <button
                      key={item.name}
                      onClick={() => pickSuggestion(item)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                    >
                      <span className="text-lg w-6 text-center">{cat?.emoji ?? '·'}</span>
                      <div>
                        <span className="text-sm text-slate-800">{item.name}</span>
                        {cat && <span className="text-xs text-slate-400 ml-2">{cat.label}</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Category selection */}
          <div className="px-4 pb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Категория <span className="font-normal normal-case text-slate-400">(необязательно)</span>
            </label>

            {categories.length === 0 && !showAddCat ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-sm text-slate-500 mb-3">Категорий пока нет</p>
                <button
                  onClick={() => setShowAddCat(true)}
                  className="text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors"
                >
                  + Создать первую категорию
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border-2 transition-all text-left ${
                      selectedCat === cat.id
                        ? 'border-sky-400 bg-sky-50 text-sky-700'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl leading-none">{cat.emoji}</span>
                    <span className="text-sm font-medium truncate">{cat.label}</span>
                    {selectedCat === cat.id && (
                      <span className="ml-auto text-sky-500 text-xs shrink-0">✓</span>
                    )}
                  </button>
                ))}

                {/* Add category button */}
                {!showAddCat && (
                  <button
                    onClick={() => setShowAddCat(true)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500 transition-colors"
                  >
                    <span className="text-2xl leading-none">+</span>
                    <span className="text-sm font-medium">Новая</span>
                  </button>
                )}
              </div>
            )}

            {/* Inline add category form */}
            {showAddCat && (
              <div className="mt-2 bg-sky-50 border border-sky-100 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-semibold text-sky-700">Новая категория</p>
                <div className="flex gap-2">
                  <input
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    placeholder="😀"
                    maxLength={2}
                    className="w-14 text-center text-2xl bg-white border border-sky-200 rounded-xl outline-none focus:border-sky-400 py-2"
                  />
                  <input
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Название..."
                    className="flex-1 bg-white border border-sky-200 rounded-xl px-3 outline-none focus:border-sky-400 text-sm text-slate-800"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCategory}
                    disabled={!newLabel.trim()}
                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium py-2 rounded-xl disabled:opacity-40 transition-colors"
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => { setShowAddCat(false); setNewEmoji(''); setNewLabel('') }}
                    className="px-4 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Selected category tag */}
            {selectedCatObj && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-400">Выбрано:</span>
                <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-sm px-3 py-1 rounded-full border border-sky-100">
                  {selectedCatObj.emoji} {selectedCatObj.label}
                  <button onClick={() => setSelectedCat(null)} className="text-sky-400 hover:text-sky-700 ml-0.5 leading-none">×</button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer save button */}
        <div className="px-4 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {mode === 'fridge' ? '🧊 Добавить в холодильник' : '🛒 Добавить в список'}
          </button>
        </div>
      </div>
    </div>
  )
}
