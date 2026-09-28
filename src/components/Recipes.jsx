import { useState } from 'react'
import { useStore } from '../store'
import RecipeEditor from './RecipeEditor'
import { formatRelativeDate } from '../utils'

export default function Recipes() {
  const { recipes, fridgeItems, deleteRecipe, markCooked, addMissingToList } = useStore()
  const [threshold, setThreshold]   = useState(60)
  const [search, setSearch]         = useState('')
  const [editing, setEditing]       = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [justCooked, setJustCooked] = useState(null)

  const fridgeNames = fridgeItems.map(i => i.name.toLowerCase())

  function calcMatch(recipe) {
    if (!recipe.ingredients.length) return { pct: 0, have: [], missing: [] }
    const have    = recipe.ingredients.filter(ing =>  fridgeNames.includes(ing.toLowerCase()))
    const missing = recipe.ingredients.filter(ing => !fridgeNames.includes(ing.toLowerCase()))
    return { pct: Math.round((have.length / recipe.ingredients.length) * 100), have, missing }
  }

  const matchesSearch = r => !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.ingredients.some(ing => ing.toLowerCase().includes(search.toLowerCase()))

  const scored = recipes
    .map(r => ({ ...r, match: calcMatch(r) }))
    .filter(r => r.match.pct >= threshold && matchesSearch(r))
    .sort((a, b) => b.match.pct - a.match.pct)

  const hiddenCount = recipes.filter(r => {
    const m = calcMatch(r)
    return m.pct < threshold && matchesSearch(r)
  }).length

  function handleMarkCooked(id) {
    markCooked(id)
    setJustCooked(id)
    setTimeout(() => setJustCooked(v => v === id ? null : v), 2500)
  }

  if (editing !== null) {
    return <RecipeEditor recipe={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
  }

  return (
    <div className="space-y-3">
      {/* Search — always visible */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2 px-3 py-3">
        <span className="text-slate-300 text-lg shrink-0">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по рецептам и ингредиентам..."
          className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-base"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500 text-xl leading-none">×</button>
        )}
      </div>

      {/* Availability slider */}
      {recipes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm text-slate-600">Минимум ингредиентов</span>
            <span className="text-sm font-bold text-sky-600 tabular-nums">{threshold}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={10}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-slate-100 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>Все рецепты</span>
            <span>Только с полным набором</span>
          </div>
        </div>
      )}

      {/* Recipe list */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 select-none">
          <div className="text-6xl mb-4">📖</div>
          <p className="font-semibold text-slate-500 text-base">Рецептов пока нет</p>
          <p className="text-sm text-slate-400 mt-1">Создайте первый — это займёт минуту</p>
        </div>
      ) : scored.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-sm">{search ? 'По запросу ничего не найдено' : `Нет рецептов с ${threshold}%+ ингредиентов`}</p>
          <button
            onClick={() => { setThreshold(0); setSearch('') }}
            className="mt-2 text-sky-500 text-sm hover:text-sky-600"
          >
            Показать все рецепты
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {scored.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              justCooked={justCooked === recipe.id}
              onEdit={() => setEditing(recipe)}
              onDelete={() => setConfirmDelete(recipe.id)}
              onCooked={() => handleMarkCooked(recipe.id)}
              onAddMissing={() => addMissingToList(recipe.id)}
            />
          ))}
          {hiddenCount > 0 && (
            <p className="text-xs text-slate-400 text-center py-1">
              Ещё {hiddenCount} скрыто (меньше {threshold}%) ·{' '}
              <button onClick={() => setThreshold(0)} className="text-sky-500">показать все</button>
            </p>
          )}
        </div>
      )}

      {/* Add recipe button */}
      <button
        onClick={() => setEditing('new')}
        className="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-3.5 rounded-2xl transition-colors shadow-sm"
      >
        + Новый рецепт
      </button>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <p className="text-slate-800 font-medium mb-1">Удалить рецепт?</p>
            <p className="text-slate-400 text-sm mb-4">Это действие нельзя отменить</p>
            <div className="flex gap-2">
              <button
                onClick={() => { deleteRecipe(confirmDelete); setConfirmDelete(null) }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-medium transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RecipeCard({ recipe, justCooked, onEdit, onDelete, onCooked, onAddMissing }) {
  const { pct, missing } = recipe.match
  const [open, setOpen]  = useState(false)
  const lastDate         = formatRelativeDate(recipe.lastCookedAt)

  const statusColor = pct === 100 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-rose-400'
  const barColor    = pct === 100 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400'
  const have        = recipe.ingredients.length - missing.length

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      justCooked ? 'border-emerald-300 shadow-emerald-100' : pct === 100 ? 'border-emerald-200' : 'border-slate-100'
    }`}>
      {/* Card header */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-start gap-3">
          {/* Info — tappable to expand */}
          <button className="flex-1 text-left min-w-0" onClick={() => setOpen(v => !v)}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg leading-none ${statusColor}`}>
                {pct === 100 ? '✅' : pct >= 60 ? '⚠️' : '❌'}
              </span>
              <span className="font-semibold text-slate-800 text-base leading-tight">
                {recipe.name}
              </span>
              {justCooked && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                  🍽️ Готово!
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0 tabular-nums">{have}/{recipe.ingredients.length}</span>
            </div>
            {lastDate && (
              <p className="text-xs text-slate-400 mt-1.5">
                ⏱ последний раз {lastDate}
              </p>
            )}
          </button>

          {/* Actions */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={onCooked}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                justCooked
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-500'
              }`}
            >
              🍳 Готово
            </button>
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="w-8 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors text-sm"
              >
                ✏️
              </button>
              <button
                onClick={onDelete}
                className="w-8 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded ingredients */}
      {open && (
        <div className="border-t border-slate-50 px-4 py-3 space-y-1.5">
          {recipe.ingredients.map(ing => {
            const have = !missing.includes(ing)
            return (
              <div key={ing} className="flex items-center gap-2 text-sm">
                <span className={have ? 'text-emerald-500' : 'text-rose-400'}>{have ? '✓' : '✗'}</span>
                <span className={have ? 'text-slate-700' : 'text-slate-500'}>{ing}</span>
                {!have && <span className="text-xs text-slate-400 ml-auto">нет в холодильнике</span>}
              </div>
            )
          })}
          {missing.length > 0 && (
            <button
              onClick={onAddMissing}
              className="mt-2 w-full flex items-center gap-2 text-sm text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-xl transition-colors"
            >
              <span>🛒</span>
              <span>Добавить {missing.length} недостающих в список покупок</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
