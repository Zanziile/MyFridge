import { useState, useMemo } from 'react'
import { useStore } from '../store'
import AddProductPage from './AddProductPage'

export default function Fridge() {
  const { fridgeItems, history, categories, addToFridge, removeFromFridge, removeFromHistory } = useStore()
  const [search, setSearch]             = useState('')
  const [showAddPage, setShowAddPage]   = useState(false)
  const [historyOpen, setHistoryOpen]   = useState(true)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  // History items not currently in fridge
  const historyNotInFridge = history.filter(
    h => !fridgeItems.some(i => i.name.toLowerCase() === h.name.toLowerCase())
  )

  // Filter fridge by search
  const filteredFridge = search.trim()
    ? fridgeItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : fridgeItems

  // Filter history by search
  const filteredHistory = search.trim()
    ? historyNotInFridge.filter(h => h.name.toLowerCase().includes(search.toLowerCase()))
    : historyNotInFridge

  // Group fridge items by category
  const fridgeGroups = useMemo(() => groupByCategory(filteredFridge), [filteredFridge])

  // Group history by category
  const historyGroups = useMemo(() => groupByCategory(filteredHistory), [filteredHistory])

  function handleAddProduct(name, category) {
    addToFridge(name, category)
  }

  return (
    <div className="space-y-3">
      {/* Search + Add button */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2 px-3 py-3">
        <span className="text-slate-300 text-lg shrink-0">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={fridgeItems.length === 0 ? 'Холодильник пуст...' : 'Поиск продуктов...'}
          className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-base"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500 text-xl leading-none">×</button>
        )}
        <button
          onClick={() => setShowAddPage(true)}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-sky-500 text-white text-xl font-bold hover:bg-sky-600 active:bg-sky-700 transition-colors"
        >
          +
        </button>
      </div>

      {/* Fridge content */}
      {fridgeItems.length === 0 ? (
        <div className="text-center py-16 select-none">
          <div className="text-6xl mb-4">🧊</div>
          <p className="font-semibold text-slate-500 text-base">Холодильник пуст</p>
          <p className="text-sm text-slate-400 mt-1">Нажмите + чтобы добавить продукты</p>
          <button
            onClick={() => setShowAddPage(true)}
            className="mt-4 bg-sky-500 text-white font-medium px-6 py-2.5 rounded-xl text-sm hover:bg-sky-600 transition-colors"
          >
            + Добавить первый продукт
          </button>
        </div>
      ) : filteredFridge.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          Ничего не найдено по запросу <span className="font-medium text-slate-600">«{search}»</span>
        </div>
      ) : (
        <div className="space-y-2">
          {renderCategoryGroups(fridgeGroups, catMap, (item) => removeFromFridge(item.id))}
        </div>
      )}

      {/* History / Quick add */}
      {filteredHistory.length > 0 && (
        <div className="space-y-2">
          {/* History header */}
          <button
            onClick={() => setHistoryOpen(v => !v)}
            className="w-full flex items-center gap-2 px-1 py-1"
          >
            <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${historyOpen ? 'rotate-90' : ''}`}>▶</span>
            <span className="text-sm font-semibold text-slate-600">Быстрое добавление</span>
            <span className="text-xs text-slate-400">({filteredHistory.length})</span>
            <span className="ml-auto text-xs text-slate-400">tap чтобы добавить</span>
          </button>

          {/* Animated accordion */}
          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${historyOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="min-h-0 overflow-hidden">
              <div className="space-y-2 pt-0.5">
                {renderHistoryGroups(historyGroups, catMap, addToFridge, removeFromHistory)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add product page */}
      {showAddPage && (
        <AddProductPage
          mode="fridge"
          onClose={() => setShowAddPage(false)}
          onAdd={handleAddProduct}
        />
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByCategory(items) {
  const groups = new Map()
  items.forEach(item => {
    const key = item.category ?? '__none__'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  // Sort: named categories first (alphabetical by label via catId), uncategorized last
  return groups
}

function renderCategoryGroups(groups, catMap, onRemove) {
  const entries = [...groups.entries()].sort(([a], [b]) => {
    if (a === '__none__') return 1
    if (b === '__none__') return -1
    const la = catMap[a]?.label ?? ''
    const lb = catMap[b]?.label ?? ''
    return la.localeCompare(lb, 'ru')
  })

  return entries.map(([catId, items]) => {
    const cat = catId === '__none__' ? null : catMap[catId]
    return (
      <FridgeCategoryGroup
        key={catId}
        cat={cat}
        items={items}
        onRemove={onRemove}
      />
    )
  })
}

function renderHistoryGroups(groups, catMap, onAdd, onDelete) {
  const entries = [...groups.entries()].sort(([a], [b]) => {
    if (a === '__none__') return 1
    if (b === '__none__') return -1
    const la = catMap[a]?.label ?? ''
    const lb = catMap[b]?.label ?? ''
    return la.localeCompare(lb, 'ru')
  })

  return entries.map(([catId, items]) => {
    const cat = catId === '__none__' ? null : catMap[catId]
    return (
      <HistoryCategoryGroup
        key={catId}
        cat={cat}
        items={items}
        onAdd={onAdd}
        onDelete={onDelete}
      />
    )
  })
}

// ─── Fridge accordion group ───────────────────────────────────────────────────

function FridgeCategoryGroup({ cat, items, onRemove }) {
  const [open, setOpen] = useState(true)

  const title = cat ? `${cat.emoji} ${cat.label}` : 'Без категории'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
      >
        <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
        <span className={`font-semibold ${cat ? 'text-slate-700' : 'text-slate-400'}`}>{title}</span>
        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
      </button>

      {/* Items (animated) */}
      <div className={`grid transition-[grid-template-rows] duration-250 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-50">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-slate-50' : ''}`}
              >
                <span className="flex-1 text-slate-800 text-base">{item.name}</span>
                <button
                  onClick={() => onRemove(item)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  title="Убрать из холодильника"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── History accordion group ──────────────────────────────────────────────────

function HistoryCategoryGroup({ cat, items, onAdd, onDelete }) {
  const [open, setOpen] = useState(true)

  const title = cat ? `${cat.emoji} ${cat.label}` : 'Без категории'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
      >
        <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
        <span className={`font-semibold ${cat ? 'text-slate-700' : 'text-slate-400'}`}>{title}</span>
        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
      </button>

      {/* Chips (animated) */}
      <div className={`grid transition-[grid-template-rows] duration-250 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-50 px-3 py-3 flex flex-wrap gap-2">
            {items.map(item => (
              <HistoryChip
                key={item.name}
                item={item}
                onAdd={() => onAdd(item.name, item.category)}
                onDelete={() => onDelete(item.name)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryChip({ item, onAdd, onDelete }) {
  return (
    <div className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 overflow-hidden">
      {/* Add tap zone */}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 text-sm text-sky-700 hover:bg-sky-100 active:bg-sky-200 transition-colors"
      >
        {item.name}
        <span className="text-sky-400 text-xs">+</span>
      </button>
      {/* Delete */}
      <button
        onClick={onDelete}
        className="pr-2 pl-0.5 py-1.5 text-sky-300 hover:text-red-400 transition-colors"
        title="Удалить из истории навсегда"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
