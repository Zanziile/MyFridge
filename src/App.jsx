import { useState, useEffect } from 'react'
import Fridge from './components/Fridge'
import Recipes from './components/Recipes'
import BuyList from './components/BuyList'
import { useStore } from './store'

export default function App() {
  const [tab, setTab] = useState('fridge')
  const { fridgeItems, shoppingList } = useStore()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) { tg.ready(); tg.expand() }
  }, [])

  const buyBadge = shoppingList.filter(i => !i.done).length

  const tabs = [
    { id: 'fridge',  icon: '🧊', label: 'Холодильник', badge: fridgeItems.length },
    { id: 'recipes', icon: '📖', label: 'Рецепты',     badge: 0 },
    { id: 'buy',     icon: '🛒', label: 'Купить',      badge: buyBadge },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto">
      <main className="flex-1 px-4 pt-4 pb-28">
        {tab === 'fridge'  && <Fridge />}
        {tab === 'recipes' && <Recipes />}
        {tab === 'buy'     && <BuyList />}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100 max-w-lg mx-auto"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="flex">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 relative flex flex-col items-center pt-2.5 pb-1.5 gap-0.5 transition-colors select-none ${
                tab === t.id ? 'text-sky-500' : 'text-slate-400 active:text-slate-500'
              }`}
            >
              {/* Active indicator */}
              {tab === t.id && (
                <span className="absolute top-0 left-8 right-8 h-0.5 bg-sky-500 rounded-b-full" />
              )}
              <span className="text-2xl leading-none">{t.icon}</span>
              <span className="text-xs font-medium">{t.label}</span>
              {t.badge > 0 && (
                <span className="absolute top-2 right-[22%] min-w-[17px] h-[17px] bg-sky-500 text-white text-[10px] rounded-full flex items-center justify-center px-1 font-bold leading-none">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
