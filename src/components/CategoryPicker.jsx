import { useState } from 'react'
import { useStore } from '../store'

export default function CategoryPicker({ onClose }) {
  const { categories, addCategory, deleteCategory } = useStore()
  const [emoji, setEmoji] = useState('')
  const [label, setLabel] = useState('')

  function handleAdd() {
    if (!label.trim()) return
    addCategory(emoji || '📦', label)
    setEmoji('')
    setLabel('')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Мои категории</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        {/* Existing categories */}
        <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-slate-700 text-sm">{cat.label}</span>
              </div>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none px-1"
                title="Удалить категорию"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add new category */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <p className="text-xs text-slate-500 font-medium">Новая категория</p>
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              placeholder="😀"
              maxLength={2}
              className="w-14 text-center text-2xl bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-sky-400 py-1.5"
            />
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Название..."
              className="flex-1 bg-slate-50 rounded-xl px-3 outline-none border border-slate-200 focus:border-sky-400 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={!label.trim()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <p className="text-xs text-slate-400">Введите эмодзи и название — например 🍕 и "Фастфуд"</p>
        </div>

        <div className="px-4 pb-4">
          <button onClick={onClose} className="w-full btn-primary py-2.5 rounded-xl">
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}
