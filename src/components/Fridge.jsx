import { useState, useRef } from 'react'
import { useStore } from '../store'
import CategoryPicker from './CategoryPicker'

export default function Fridge() {
  const { fridgeItems, history, categories, addToFridge, removeFromFridge } = useStore()
  const [input, setInput]           = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const [filterCat, setFilterCat]   = useState(null)
  const [showCatRow, setShowCatRow] = useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)
  const inputRef = useRef(null)

  const catMap   = Object.fromEntries(categories.map(c => [c.id, c]))
  const isTyping = input.trim().length > 0

  const historyNotInFridge = history.filter(
    h => !fridgeItems.some(i => i.name.toLowerCase() === h.name.toLowerCase())
  )

  // While typing: filter history as inline suggestions
  const inlineSuggestions = isTyping
    ? historyNotInFridge.filter(h => h.name.toLowerCase().includes(input.toLowerCase()))
    : []

  const displayedFridge = fridgeItems.filter(item => {
    const matchSearch = !isTyping || item.name.toLowerCase().includes(input.toLowerCase())
    const matchCat    = !filterCat || item.category === filterCat
    return matchSearch && matchCat
  })

  const usedCats = [...new Set(fridgeItems.map(i => i.category).filter(Boolean))]
  const selectedCatObj = selectedCat ? catMap[selectedCat] : null

  function doAdd(name, cat) {
    const val = (name ?? input).trim()
    if (!val) return
    addToFridge(val, cat ?? selectedCat)
    setInput('')
    setSelectedCat(null)
    setShowCatRow(false)
    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter') doAdd()
    if (e.key === 'Escape') { setInput(''); setShowCatRow(false) }
  }

  return (
    <div className="space-y-3">
      {/* ─── Unified search + add ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-3">
          <span className="text-slate-300 text-lg shrink-0">🔍</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={fridgeItems.length === 0 ? 'Добавить первый продукт...' : 'Поиск или добавить...'}
            className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-base"
          />

          {/* Category toggle */}
          <button
            onClick={() => setShowCatRow(v => !v)}
            title="Категория"
            className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
              selectedCatObj
                ? 'bg-sky-100 text-sky-600 ring-1 ring-sky-300'
                : showCatRow
                  ? 'bg-slate-100 text-slate-600'
                  : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span className="text-lg">{selectedCatObj ? selectedCatObj.emoji : '🏷️'}</span>
          </button>

          {/* Add button */}
          <button
            onClick={() => doAdd()}
            disabled={!input.trim()}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-sky-500 text-white text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sky-600 active:bg-sky-700 transition-colors"
          >
            +
          </button>
        </div>

        {/* Category row (collapsible) */}
        {showCatRow && (
          <div className="border-t border-slate-100 px-3 py-2.5">
            <p className="text-xs text-slate-400 mb-2">Выберите категорию:</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCat(selectedCat === cat.id ? null : cat.id)
                    setShowCatRow(false)
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-sm transition-colors ${
                    selectedCat === cat.id
                      ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-300 font-medium'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
              <button
                onClick={() => { setShowCatPicker(true); setShowCatRow(false) }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-sm text-sky-500 bg-sky-50 hover:bg-sky-100 transition-colors"
              >
                + своя
              </button>
            </div>
          </div>
        )}

        {/* Selected category tag */}
        {selectedCatObj && !showCatRow && (
          <div className="border-t border-slate-50 px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Категория:</span>
            <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs px-2 py-0.5 rounded-full border border-sky-100">
              {selectedCatObj.emoji} {selectedCatObj.label}
              <button
                onClick={() => setSelectedCat(null)}
                className="text-sky-400 hover:text-sky-700 ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* ─── Inline suggestions when typing ─── */}
      {isTyping && inlineSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-400 px-1">Из истории:</p>
          <div className="flex flex-wrap gap-2">
            {inlineSuggestions.slice(0, 8).map(item => {
              const cat = catMap[item.category]
              return (
                <button
                  key={item.name}
                  onClick={() => doAdd(item.name, item.category)}
                  className="tag-chip"
                >
                  {cat && <span>{cat.emoji}</span>}
                  {item.name}
                  <span className="text-sky-400">+</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Category filter strip ─── */}
      {usedCats.length > 1 && !isTyping && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setFilterCat(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !filterCat
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Все · {fridgeItems.length}
          </button>
          {usedCats.map(catId => {
            const cat   = catMap[catId]
            const count = fridgeItems.filter(i => i.category === catId).length
            if (!cat) return null
            return (
              <button
                key={catId}
                onClick={() => setFilterCat(filterCat === catId ? null : catId)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterCat === catId
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat.emoji} {count}
              </button>
            )
          })}
        </div>
      )}

      {/* ─── Fridge items ─── */}
      {fridgeItems.length === 0 ? (
        <div className="text-center py-16 text-slate-400 select-none">
          <div className="text-6xl mb-4">🧊</div>
          <p className="font-semibold text-slate-500 text-base">Холодильник пуст</p>
          <p className="text-sm mt-1">Введите название продукта выше</p>
        </div>
      ) : displayedFridge.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          {isTyping
            ? <><span className="font-medium text-slate-600">«{input}»</span> не найдено · нажмите Enter чтобы добавить</>
            : 'Нет продуктов в этой категории'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {displayedFridge.map((item, idx) => {
            const cat = catMap[item.category]
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-slate-50' : ''}`}
              >
                <span className="text-xl w-7 text-center shrink-0 leading-none">
                  {cat?.emoji ?? <span className="text-slate-200">·</span>}
                </span>
                <span className="flex-1 text-slate-800 text-base">{item.name}</span>
                <button
                  onClick={() => removeFromFridge(item.id)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  title="Убрать"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── History / Quick add ─── */}
      {!isTyping && historyNotInFridge.length > 0 && (
        <HistorySection
          items={historyNotInFridge}
          catMap={catMap}
          onAdd={doAdd}
        />
      )}

      {showCatPicker && (
        <CategoryPicker onClose={() => setShowCatPicker(false)} />
      )}
    </div>
  )
}

function HistorySection({ items, catMap, onAdd }) {
  const [open, setOpen]     = useState(true)
  const [search, setSearch] = useState('')

  const filtered = search
    ? items.filter(h => h.name.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span className={`text-[10px] transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className="font-medium">Быстрое добавление</span>
          <span className="text-slate-400">({items.length})</span>
        </button>

        {open && items.length > 6 && (
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Фильтр..."
              className="w-20 text-xs outline-none bg-transparent text-slate-700 placeholder-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500 text-sm leading-none">×</button>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="flex flex-wrap gap-2">
          {filtered.slice(0, 30).map(item => {
            const cat = catMap[item.category]
            return (
              <button
                key={item.name}
                onClick={() => onAdd(item.name, item.category)}
                className="tag-chip"
              >
                {cat && <span className="leading-none">{cat.emoji}</span>}
                {item.name}
                <span className="text-sky-400 leading-none">+</span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 py-2">Ничего не найдено</p>
          )}
        </div>
      )}
    </div>
  )
}
