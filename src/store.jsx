import { createContext, useContext, useState, useCallback } from 'react'
import { historyScore } from './utils'
import { DEFAULT_CATEGORIES } from './constants'

// ─── localStorage helper ───────────────────────────────────────────────────

function useLS(key, initial, migrate) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      const parsed = raw !== null ? JSON.parse(raw) : initial
      return migrate ? migrate(parsed) : parsed
    } catch {
      return initial
    }
  })

  const set = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }, [key])

  return [value, set]
}

// ─── Migrations (backward compat with v1 data) ─────────────────────────────

function migrateHistory(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(item =>
    typeof item === 'string'
      ? { name: item, count: 1, lastEatenAt: null, category: null }
      : { count: 1, lastEatenAt: null, category: null, ...item }
  )
}

function migrateFridge(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(item =>
    typeof item === 'object' ? { category: null, ...item } : item
  )
}

function migrateRecipes(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(r =>
    typeof r === 'object' ? { lastCookedAt: null, ...r } : r
  )
}

// ─── Store ─────────────────────────────────────────────────────────────────

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  // categories: [{ id, emoji, label }]  — default + custom
  const [categories, setCategories] = useLS('fridge_categories', DEFAULT_CATEGORIES)
  // fridgeItems: [{ id, name, category }]
  const [fridgeItems, setFridgeItems] = useLS('fridge_items', [], migrateFridge)
  // history: [{ name, count, lastEatenAt, category }]
  const [history, setHistory] = useLS('fridge_history', [], migrateHistory)
  // recipes: [{ id, name, ingredients: string[], lastCookedAt }]
  const [recipes, setRecipes] = useLS('fridge_recipes', [], migrateRecipes)
  // shoppingList: [{ id, name, done, fromRecipe }]
  const [shoppingList, setShoppingList] = useLS('fridge_shopping', [])

  // ── Categories ───────────────────────────────────────────────────────────

  const addCategory = useCallback((emoji, label) => {
    const trimmed = label.trim()
    const e = emoji.trim() || '📦'
    if (!trimmed) return
    const id = `custom_${Date.now()}`
    setCategories(prev => [...prev, { id, emoji: e, label: trimmed }])
  }, [setCategories])

  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    // Remove category from history and fridge items that used it
    setHistory(prev => prev.map(h => h.category === id ? { ...h, category: null } : h))
    setFridgeItems(prev => prev.map(i => i.category === id ? { ...i, category: null } : i))
  }, [setCategories, setHistory, setFridgeItems])

  // ── Fridge ───────────────────────────────────────────────────────────────

  const addToFridge = useCallback((name, category = null) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setFridgeItems(prev => {
      if (prev.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) return prev
      return [...prev, { id: Date.now(), name: trimmed, category }]
    })
    setHistory(prev => {
      const idx = prev.findIndex(h => h.name.toLowerCase() === trimmed.toLowerCase())
      if (idx === -1) {
        return [{ name: trimmed, count: 1, lastEatenAt: null, category }, ...prev].slice(0, 100)
      }
      const updated = [...prev]
      updated[idx] = {
        ...updated[idx],
        count: (updated[idx].count || 0) + 1,
        category: category ?? updated[idx].category,
      }
      return updated
    })
  }, [setFridgeItems, setHistory])

  const removeFromFridge = useCallback((id) => {
    setFridgeItems(prev => prev.filter(i => i.id !== id))
  }, [setFridgeItems])

  // ── Recipes ──────────────────────────────────────────────────────────────

  const addRecipe = useCallback((name, ingredients) => {
    const trimmed = name.trim()
    if (!trimmed || ingredients.length === 0) return
    setRecipes(prev => [...prev, { id: Date.now(), name: trimmed, ingredients, lastCookedAt: null }])
  }, [setRecipes])

  const updateRecipe = useCallback((id, name, ingredients) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, name, ingredients } : r))
  }, [setRecipes])

  const deleteRecipe = useCallback((id) => {
    setRecipes(prev => prev.filter(r => r.id !== id))
  }, [setRecipes])

  const markCooked = useCallback((id) => {
    const recipe = recipes.find(r => r.id === id)
    if (!recipe) return
    const now = Date.now()
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, lastCookedAt: now } : r))
    setHistory(prev => prev.map(h => {
      const used = recipe.ingredients.some(ing => ing.toLowerCase() === h.name.toLowerCase())
      return used ? { ...h, lastEatenAt: now } : h
    }))
  }, [recipes, setRecipes, setHistory])

  // ── Shopping list ─────────────────────────────────────────────────────────

  const addToShoppingList = useCallback((name, fromRecipe = null) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setShoppingList(prev => {
      if (prev.some(i => !i.done && i.name.toLowerCase() === trimmed.toLowerCase())) return prev
      return [...prev, { id: Date.now(), name: trimmed, done: false, fromRecipe }]
    })
  }, [setShoppingList])

  const toggleShoppingItem = useCallback((id) => {
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }, [setShoppingList])

  const removeShoppingItem = useCallback((id) => {
    setShoppingList(prev => prev.filter(i => i.id !== id))
  }, [setShoppingList])

  const clearDoneItems = useCallback(() => {
    setShoppingList(prev => prev.filter(i => !i.done))
  }, [setShoppingList])

  const addMissingToList = useCallback((recipeId) => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return
    const fridgeNames = fridgeItems.map(i => i.name.toLowerCase())
    recipe.ingredients
      .filter(ing => !fridgeNames.includes(ing.toLowerCase()))
      .forEach(name => addToShoppingList(name, recipe.name))
  }, [recipes, fridgeItems, addToShoppingList])

  const sortedHistory = [...history].sort((a, b) => historyScore(b) - historyScore(a))

  return (
    <StoreContext.Provider value={{
      categories,
      fridgeItems,
      history: sortedHistory,
      recipes,
      shoppingList,
      addCategory, deleteCategory,
      addToFridge, removeFromFridge,
      addRecipe, updateRecipe, deleteRecipe, markCooked,
      addToShoppingList, toggleShoppingItem, removeShoppingItem, clearDoneItems, addMissingToList,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
