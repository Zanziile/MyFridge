import { useState } from 'react'
import { useStore } from '../store'
import { formatRelativeDate } from '../utils'
import AddProductPage from './AddProductPage'

export default function BuyList() {
  const {
    shoppingList, history, fridgeItems, categories,
    addToShoppingList, toggleShoppingItem, removeShoppingItem, clearDoneItems,
    addToFridge,
  } = useStore()
  const [showAddPage, setShowAddPage] = useState(false)
  const [histSearch, setHistSearch]   = useState('')
  const [historyOpen, setHistoryOpen] = useState(true)

  const catMap      = Object.fromEntries(categories.map(c => [c.id, c]))
  const fridgeNames = fridgeItems.map(i => i.name.toLowerCase())
  const doneCount   = shoppingList.filter(i => i.done).length
  const todoCount   = shoppingList.filter(i => !i.done).length

  const histFiltered = history
    .filter(h => !fridgeNames.includes(h.name.toLowerCase()))
    .filter(h => !histSearch || h.name.toLowerCase().includes(histSearch.toLowerCase()))

  function moveDoneToFridge() {
    shoppingList.filter(i => i.done).forEach(item => addToFridge(item.name))
    clearDoneItems()
  }

  return (
    <div className="space-y-3">
      {/* Add to list button */}
      <button
        onClick={() => setShowAddPage(true)}
        className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 text-slate-400 hover:text-sky-500 hover:border-sky-200 transition-colors"
      >
        <span className="text-lg text-sky-500">🛒</span>
        <span className="text-base">Добавить в список покупок...</span>
        <span className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl bg-sky-500 text-white text-xl font-bold shrink-0">+</span>
      </button>

      {/* Shopping list */}
      {shoppingList.length === 0 ? (
        <div className="text-center py-14 select-none">
          <div className="text-6xl mb-4">🛒</div>
          <p className="font-semibold text-slate-500 text-base">Список покупок пуст</p>
          <p className="text-sm text-slate-400 mt-1">Добавьте вручную или через рецепты</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* List header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <span className="text-sm font-semibold text-slate-700">
              Список покупок
              {todoCount > 0 && <span className="text-slate-400 font-normal ml-1">· {todoCount} шт</span>}
            </span>
            {doneCount > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={moveDoneToFridge}
                  className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl transition-colors font-medium"
                >
                  🧊 В холодильник
                </button>
                <button
                  onClick={clearDoneItems}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Убрать ({doneCount})
                </button>
              </div>
            )}
          </div>

          {shoppingList.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-slate-50' : ''}`}
            >
              <button
                onClick={() => toggleShoppingItem(item.id)}
                className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  item.done ? 'bg-emerald-400 border-emerald-400' : 'border-slate-300 hover:border-sky-400'
                }`}
              >
                {item.done && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-base block truncate transition-colors ${item.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {item.name}
                </span>
                {item.fromRecipe && (
                  <span className="text-xs text-slate-400">из «{item.fromRecipe}»</span>
                )}
              </div>
              <button
                onClick={() => removeShoppingItem(item.id)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Smart history */}
      {history.length > 0 && (
        <div className="space-y-2">
          {/* Header */}
          <button
            onClick={() => setHistoryOpen(v => !v)}
            className="w-full flex items-center gap-2 px-1 py-1"
          >
            <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${historyOpen ? 'rotate-90' : ''}`}>▶</span>
            <span className="text-sm font-semibold text-slate-600">Часто покупаете</span>
            <span className="text-xs text-slate-400">({history.filter(h => !fridgeNames.includes(h.name.toLowerCase())).length})</span>
            <span className="ml-auto text-xs text-slate-400">↑ по частоте</span>
          </button>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${historyOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="min-h-0 overflow-hidden">
              <div className="space-y-2 pt-0.5">
                {/* Search */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2 px-3 py-2.5">
                  <span className="text-slate-300 text-base shrink-0">🔍</span>
                  <input
                    value={histSearch}
                    onChange={e => setHistSearch(e.target.value)}
                    placeholder="Поиск в истории..."
                    className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm"
                  />
                  {histSearch && (
                    <button onClick={() => setHistSearch('')} className="text-slate-300 hover:text-slate-500 text-xl leading-none">×</button>
                  )}
                </div>

                {histFiltered.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Ничего не найдено</p>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {histFiltered.slice(0, 20).map((item, idx) => {
                      const cat       = catMap[item.category]
                      const inList    = shoppingList.some(s => !s.done && s.name.toLowerCase() === item.name.toLowerCase())
                      const lastEaten = formatRelativeDate(item.lastEatenAt)

                      return (
                        <div
                          key={item.name}
                          className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-slate-50' : ''}`}
                        >
                          <span className="text-xl w-7 text-center shrink-0 leading-none">{cat?.emoji ?? '·'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                            <p className="text-xs text-slate-400">
                              {item.count > 1 ? `${item.count}× покупали` : '1 раз'}
                              {lastEaten && ` · ели ${lastEaten}`}
                            </p>
                          </div>
                          <button
                            onClick={() => !inList && addToShoppingList(item.name)}
                            disabled={inList}
                            className={`shrink-0 text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                              inList
                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                : 'bg-sky-50 text-sky-600 hover:bg-sky-100 active:bg-sky-200'
                            }`}
                          >
                            {inList ? '✓ В списке' : '+ список'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add product page */}
      {showAddPage && (
        <AddProductPage
          mode="shopping"
          onClose={() => setShowAddPage(false)}
          onAdd={(name) => addToShoppingList(name)}
        />
      )}
    </div>
  )
}
