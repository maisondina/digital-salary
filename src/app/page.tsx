'use client'
import { useState, useEffect } from 'react'
import data from '@/data/copywriter.json'

type SkillLevel = 'basic' | 'confident' | 'expert' | null
type Region = 'moscow' | 'spb' | 'remote'

export default function Page() {
  const [region, setRegion] = useState<Region>('moscow')
  const [skills, setSkills] = useState<{[key:string]:SkillLevel}>({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [step, setStep] = useState(0)
  const [hovered, setHovered] = useState<{skillId:string,level:SkillLevel}|null>(null)
  const [popupPosition, setPopupPosition] = useState<{top: number, left: number} | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('visited')) {
      setShowOnboarding(true)
      localStorage.setItem('visited', '1')
    }
  }, [])

  useEffect(() => {
    if (showOnboarding && step < steps.length) {
      const elementId = steps[step].id
      const element = document.getElementById(elementId)
      if (element) {
        // Прокручиваем к элементу
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Небольшая задержка для завершения прокрутки
        setTimeout(() => {
          const rect = element.getBoundingClientRect()
          const scrollY = window.scrollY
          const scrollX = window.scrollX

          // Позиционируем попап над элементом
          setPopupPosition({
            top: rect.top + scrollY - 20,
            left: rect.left + scrollX + rect.width / 2
          })
        }, 300)
      }
    }
  }, [showOnboarding, step])

  const salary = () => {
    let total = data.base_salary
    Object.entries(skills).forEach(([id, level]) => {
      if (level) {
        const skill = data.skills.find(s => s.id === id)
        if (skill) total += skill.levels[level].salary_impact
      }
    })
    return Math.round(total * data.regions[region].coefficient)
  }

  const Star = ({filled, onClick}: {filled:boolean, onClick:()=>void}) => (
    <svg onClick={onClick} className={`w-6 h-6 cursor-pointer ${filled ? 'fill-yellow-400' : 'fill-none'} stroke-gray-400 hover:scale-110`} viewBox="0 0 24 24" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )

  const steps = [
    {id:'prof', title:'1. Выберите профессию', text:'Пока доступны копирайтеры'},
    {id:'reg', title:'2. Укажите местоположение', text:'Москва, СПб или удалённо'},
    {id:'skills', title:'3. Отметьте навыки', text:'Нажмите на звёздочки'},
    {id:'salary', title:'4. Получите результат', text:'Ваша рыночная стоимость'}
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Digital Salary</h1>
            <p className="text-sm text-gray-600">Калькулятор зарплат</p>
          </div>
          <div className="flex gap-4">
            <div id="prof">
              <label className="block text-xs text-gray-600 mb-1">Профессия</label>
              <select className="px-4 py-2 border rounded-lg">
                <option>Копирайтер</option>
              </select>
            </div>
            <div id="reg">
              <label className="block text-xs text-gray-600 mb-1">Местоположение</label>
              <select value={region} onChange={e=>setRegion(e.target.value as Region)} className="px-4 py-2 border rounded-lg">
                <option value="moscow">Москва</option>
                <option value="spb">Санкт-Петербург</option>
                <option value="remote">Удалённо</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div id="salary" className="text-center mb-16">
          <div className="text-7xl font-bold mb-4">{salary().toLocaleString('ru')} ₽</div>
          <div className="text-gray-600">в месяц до вычета налогов</div>
          <div className="text-sm text-gray-500 mt-2">{data.description}</div>
          {Object.values(skills).every(v => !v) && (
            <div className="mt-4 text-blue-600 font-medium">👇 Добавьте навыки</div>
          )}
        </div>

        <div id="skills">
          <h2 className="text-2xl font-bold mb-6 text-center">Ваши навыки</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.skills.map(skill => {
              const sel = skills[skill.id]
              return (
                <div key={skill.id} className={`border-2 rounded-xl p-4 ${sel ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <span className="font-semibold text-sm">{skill.name}</span>
                  </div>
                  <div className="flex gap-1 relative">
                    {(['basic','confident','expert'] as const).map((lvl, i) => {
                      const filled = sel && (
                        (sel==='basic' && i===0) ||
                        (sel==='confident' && i<=1) ||
                        (sel==='expert' && i<=2)
                      )
                      return (
                        <div key={lvl} className="relative"
                          onMouseEnter={()=>setHovered({skillId:skill.id,level:lvl})}
                          onMouseLeave={()=>setHovered(null)}>
                          <Star filled={!!filled} onClick={()=>setSkills(prev=>({...prev,[skill.id]:prev[skill.id]===lvl?null:lvl}))}/>
                          {hovered?.skillId===skill.id && hovered?.level===lvl && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl z-10">
                              <div className="font-semibold mb-1">{skill.levels[lvl].name}</div>
                              <div className="text-gray-300">{skill.levels[lvl].description}</div>
                              <div className="mt-2 text-green-400">+{skill.levels[lvl].salary_impact.toLocaleString('ru')} ₽</div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2">
                                <div className="border-8 border-transparent border-t-gray-900"/>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {sel && (
                    <div className="mt-2 text-green-600 font-medium text-sm">
                      +{skill.levels[sel].salary_impact.toLocaleString('ru')} ₽
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <footer className="mt-20 pt-12 border-t text-center">
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <a href="#" className="hover:text-blue-600">Методология</a>
            <a href="#" className="hover:text-blue-600">О проекте</a>
            <a href="#" className="hover:text-blue-600">Контакты</a>
          </div>
        </footer>
      </main>

      {showOnboarding && step < steps.length && popupPosition && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={()=>step<steps.length-1?setStep(step+1):setShowOnboarding(false)}/>
          <style dangerouslySetInnerHTML={{__html: `
            #${steps[step].id} {
              position: relative !important;
              z-index: 50 !important;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px 8px rgba(59, 130, 246, 0.3) !important;
              border-radius: 8px !important;
              transition: all 0.3s ease;
            }
          `}}/>
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl p-6 max-w-sm -translate-x-1/2"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-16px'
            }}
          >
            <div className="flex justify-between mb-3">
              <h3 className="text-lg font-bold">{steps[step].title}</h3>
              <button onClick={()=>setShowOnboarding(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-gray-600 mb-4">{steps[step].text}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{step+1} из {steps.length}</span>
              <button onClick={()=>step<steps.length-1?setStep(step+1):setShowOnboarding(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {step<steps.length-1?'Далее':'Понятно!'}
              </button>
            </div>
            {/* Стрелка вниз */}
            <div className="absolute top-full left-1/2 -translate-x-1/2">
              <div className="border-8 border-transparent border-t-white" style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}}/>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
