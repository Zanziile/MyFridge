import { useState, useRef } from 'react'
import { useStore } from '../store'

export default function RecipeEditor({ recipe, onClose }) {
  const { addRecipe, updateRecipe, history, fridgeItems } = useStore()
  const [name, setName] = useState(recipe?.name ?? '')
  const [ingredients, setIngredients] = useState(recipe?.ingredients ?? [])
  const [ingInput, setIngInput] = useState('')
  const ingRef = useRef(null)

  // Suggestions: fridge items + history names, not yet in recipe
  const suggestions = [...new Set([
    ...fridgeItems.map(i => i.name),
    ...history.map(h => h.name),
  ])].filter(s => !ingredients.some(i => i.toLowerCase() === s.toLowerCase()))

  function addIngredient(val) {
    const trimmed = (val ?? ingInput).trim()
    if (!trimmed) return
    if (ingredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) return
    setIngredients(prev => [...prev, trimmed])
    setIngInput('')
    ingRef.current?.focus()
  }

  function removeIngredient(ing) {
    setIngredients(prev => prev.filter(i => i !== ing))
  }

  function handleSave() {
    if (!name.trim() || ingredients.length === 0) return
    if (recipe) {
      updateRecipe(recipe.id, name.trim(), ingredients)
    } else {
      addRecipe(name.trim(), ingredients)
    }
    onClose()
  }

  const canSave = name.trim().length > 0 && ingredients.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          {recipe ? 'Редактировать рецепт' : 'Новый рецепт'}
        </h2>
        <button onClick={onClose} className="btn-ghost text-lg px-2">×</button>
      </div>

      {/* Recipe name */}
      <div className="card">
        <label className="text-xs text-slate-500 mb-1 block">Название блюда</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Например: Яичница с колбасой"
          className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 text-base"
          autoFocus
        />
      </div>

      {/* Ingredients */}
      <div className="card space-y-3">
        <label className="text-xs text-slate-500 block">Ингредиенты</label>

        {/* Added ingredients */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ingredients.map(ing => (
              <span key={ing} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                {ing}
                <button
                  onClick={() => removeIngredient(ing)}
                  className="text-emerald-500 hover:text-emerald-800 ml-0.5 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            ref={ingRef}
            value={ingInput}
            onChange={e => setIngInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIngredient()}
            placeholder="Добавить ингредиент..."
            className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400"
          />
          <button
            onClick={() => addIngredient()}
            disabled={!ingInput.trim()}
            className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Из истории:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 20).map(s => (
                <button
                  key={s}
                  onClick={() => addIngredient(s)}
                  className="tag-chip text-xs py-0.5"
                >
                  {s} <span className="text-sky-400">+</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Equation preview */}
      {ingredients.length > 0 && name && (
        <div className="card bg-sky-50 border-sky-100 text-sm text-sky-700">
          <span className="font-medium">{ingredients.join(' + ')}</span>
          <span className="text-sky-400 mx-2">→</span>
          <span className="font-semibold">{name}</span>
        </div>
      )}

      {/* Save */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 btn-primary py-3 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {recipe ? 'Сохранить' : 'Создать рецепт'}
        </button>
        <button onClick={onClose} className="btn-ghost px-6 py-3 rounded-2xl">
          Отмена
        </button>
      </div>
    </div>
  )
}
