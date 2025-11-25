'use client'
import { useState, useEffect, useCallback } from 'react'
import data from '@/data/copywriter.json'

type SkillLevel = 'basic' | 'confident' | 'expert' | null
type Region = 'moscow' | 'spb' | 'russia'
type Page = 'calc' | 'methodology' | 'about' | 'contacts'

export default function SalaryCalculator() {
  const [region, setRegion] = useState<Region>('moscow')
  const [skills, setSkills] = useState<Record<string, SkillLevel>>({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [step, setStep] = useState(0)
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)
  const [hoveredLevel, setHoveredLevel] = useState<SkillLevel>(null)
  const [currentPage, setCurrentPage] = useState<Page>('calc')

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('visited')) {
      setShowOnboarding(true)
      localStorage.setItem('visited', '1')
    }
  }, [])

  const regionNames: Record<Region, string> = {
    moscow: 'Москве',
    spb: 'Санкт-Петербурге',
    russia: 'России'
  }

  const calculateSalary = useCallback(() => {
    const regionData = data.regions[region]
    let total = regionData.median_salary

    Object.entries(skills).forEach(([id, level]) => {
      if (level) {
        const skill = data.skills.find(s => s.id === id)
        if (skill) {
          total += skill.levels[level].salary_impact
        }
      }
    })

    return total
  }, [region, skills])

  const selectedSkillsCount = Object.values(skills).filter(Boolean).length

  const getSubtitle = () => {
    const regionData = data.regions[region]
    
    if (selectedSkillsCount > 0) {
      return `Ваша рыночная стоимость в ${regionNames[region]}`
    }
    
    return `Медианная зарплата копирайтера в ${regionNames[region]} на основе ${regionData.vacancy_count} вакансий`
  }

  const setSkillLevel = useCallback((skillId: string, level: SkillLevel) => {
    setSkills(prev => {
      if (prev[skillId] === level) {
        const next = { ...prev }
        delete next[skillId]
        return next
      }
      return { ...prev, [skillId]: level }
    })
  }, [])

  const resetSkill = useCallback((skillId: string) => {
    setSkills(prev => {
      const next = { ...prev }
      delete next[skillId]
      return next
    })
  }, [])

  const levels: Array<'basic' | 'confident' | 'expert'> = ['basic', 'confident', 'expert']

  const steps = [
    { title: '1. Выберите профессию', text: 'Пока доступны копирайтеры, скоро добавим другие' },
    { title: '2. Укажите регион', text: 'Зарплаты отличаются в зависимости от города' },
    { title: '3. Отметьте навыки', text: 'Нажмите на звёздочки, чтобы указать уровень владения' },
    { title: '4. Получите результат', text: 'Это ваша рыночная стоимость' }
  ]

  const CalculatorPage = () => (
    <>
      <div className="text-center mb-16">
        <div className="text-7xl md:text-8xl font-bold mb-4 text-gray-900">
          {calculateSalary().toLocaleString('ru-RU')} ₽
        </div>
        <div className="text-xl text-gray-600 mb-2">в месяц до вычета налогов</div>
        <div className="text-sm text-gray-500">{getSubtitle()}</div>
        {selectedSkillsCount === 0 && (
          <div className="mt-6 text-blue-600 font-medium text-lg">
            👇 Добавьте навыки, чтобы увидеть свою стоимость
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-8 text-center">Ваши навыки</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.skills.map(skill => {
            const selectedLevel = skills[skill.id]
            const isSelected = !!selectedLevel

            return (
              <div
                key={skill.id}
                className={`
                  border-2 rounded-xl p-5 transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div 
                  className={`flex items-center gap-3 mb-4 ${isSelected ? 'cursor-pointer' : ''}`}
                  onClick={() => isSelected && resetSkill(skill.id)}
                >
                  <span className="text-3xl">{skill.icon}</span>
                  <span className="font-semibold text-lg">{skill.name}</span>
                </div>

                <div className="flex gap-2">
                  {levels.map((lvl, idx) => {
                    const isFilled = selectedLevel === 'basic' ? idx === 0
                      : selectedLevel === 'confident' ? idx <= 1
                      : selectedLevel === 'expert' ? true
                      : false

                    const isHovered = hoveredSkill === skill.id && hoveredLevel === lvl

                    return (
                      <div
                        key={lvl}
                        className="relative"
                        onMouseEnter={() => {
                          setHoveredSkill(skill.id)
                          setHoveredLevel(lvl)
                        }}
                        onMouseLeave={() => {
                          setHoveredSkill(null)
                          setHoveredLevel(null)
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSkillLevel(skill.id, lvl)}
                          className="p-1 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          aria-label={`${skill.name} - ${skill.levels[lvl].name}`}
                        >
                          <svg
                            className={`w-8 h-8 transition-colors ${
                              isFilled
                                ? 'fill-yellow-400 stroke-yellow-500'
                                : 'fill-gray-100 stroke-gray-300 hover:fill-yellow-100 hover:stroke-yellow-400'
                            }`}
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>

                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-gray-900 text-white text-sm rounded-xl p-4 shadow-2xl z-50 pointer-events-none">
                            <div className="font-semibold text-base mb-2">
                              {skill.levels[lvl].name}
                            </div>
                            <div className="text-gray-300 mb-3 leading-relaxed">
                              {skill.levels[lvl].description}
                            </div>
                            <div className="text-green-400 font-medium">
                              +{skill.levels[lvl].salary_impact.toLocaleString('ru-RU')} ₽ к зарплате
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2">
                              <div className="border-8 border-transparent border-t-gray-900" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {isSelected && selectedLevel && (
                  <div className="mt-3">
                    <span className="text-green-600 font-semibold">
                      +{skill.levels[selectedLevel].salary_impact.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  const MethodologyPage = () => (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => setCurrentPage('calc')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← Назад к калькулятору
      </button>

      <h1 className="text-3xl font-bold mb-8">Как это работает</h1>

      <div className="prose prose-lg">
        <p className="text-gray-600 mb-6">
          Digital Salary анализирует тысячи актуальных вакансий с hh.ru и показывает,
          как различные навыки влияют на зарплату специалиста.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">Процесс расчёта</h2>
        <ol className="space-y-4 text-gray-700">
          <li><strong>Собираем данные</strong> — анализируем все актуальные вакансии по профессии в России</li>
          <li><strong>Определяем базу</strong> — медианная зарплата по региону становится отправной точкой</li>
          <li><strong>Оцениваем навыки</strong> — сравниваем зарплаты в вакансиях с конкретным навыком и без него</li>
          <li><strong>Показываем результат</strong> — вы сразу видите свою рыночную стоимость</li>
        </ol>

        <h2 className="text-xl font-bold mt-8 mb-4">Откуда данные</h2>
        <p className="text-gray-600 mb-4">
          Все данные собираются через официальный API сервиса hh.ru — крупнейшей
          площадки по поиску работы в России.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">Почему медиана, а не среднее?</h2>
        <p className="text-gray-600 mb-4">
          <strong>Пример:</strong> 5 копирайтеров зарабатывают: 40k, 50k, 55k, 60k, 250k
        </p>
        <ul className="space-y-2 text-gray-700 mb-4">
          <li>Среднее: 91k ₽ (искажено высокой зарплатой)</li>
          <li>Медиана: 55k ₽ (реальная типичная зарплата)</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">Ограничения</h2>
        <p className="text-gray-600">
          Калькулятор показывает рыночную оценку. Реальная зарплата зависит от опыта,
          компании, портфолио и переговорных навыков.
        </p>
      </div>
    </div>
  )

  const AboutPage = () => (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => setCurrentPage('calc')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← Назад к калькулятору
      </button>

      <h1 className="text-3xl font-bold mb-8">О проекте</h1>

      <div className="prose prose-lg">
        <p className="text-xl text-gray-600 mb-6">
          Digital Salary — калькулятор рыночной стоимости диджитал-специалистов.
        </p>

        <p className="text-gray-600 mb-6">
          Узнайте, сколько вы можете зарабатывать с вашим набором навыков —
          на основе реальных данных с hh.ru.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">Технологии</h2>
        <p className="text-gray-600 mb-4">
          Создан с помощью <strong>Claude</strong> (Anthropic) — AI-ассистента.
          Next.js, TypeScript, API hh.ru.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">Планы</h2>
        <ul className="space-y-2 text-gray-700">
          <li>Больше профессий</li>
          <li>Учёт опыта работы</li>
          <li>Динамика зарплат</li>
        </ul>

        <p className="text-gray-600 mt-8">
          Open source:{' '}
          <a href="https://github.com/maisondina/digital-salary" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            github.com/maisondina/digital-salary
          </a>
        </p>
      </div>
    </div>
  )

  const ContactsPage = () => (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => setCurrentPage('calc')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← Назад к калькулятору
      </button>

      <h1 className="text-3xl font-bold mb-8">Автор</h1>

      <div className="prose prose-lg">
        <p className="text-xl text-gray-600 mb-6">
          <strong>Дина Майсон</strong> — UX-редактор
        </p>

        <p className="text-gray-600 mb-6">
          Создала этот проект, чтобы помочь специалистам понять свою рыночную стоимость.
          Весь код написан в диалоге с Claude.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">Связь</h2>
        <p className="text-gray-600">
          Telegram:{' '}
          <a href="https://t.me/maisondina" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            @maisondina
          </a>
        </p>
        <p className="text-gray-600 mt-2">
          Канал:{' '}
          <a href="https://t.me/+ZY7Np9Z9M95kMmY6" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            «Текст готов»
          </a>
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => setCurrentPage('calc')}>
            <h1 className="text-xl font-bold">Digital Salary</h1>
            <p className="text-sm text-gray-600">Калькулятор зарплат</p>
          </div>

          {currentPage === 'calc' && (
            <div className="flex gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Профессия</label>
                <select className="px-4 py-2 border rounded-lg bg-white">
                  <option>Копирайтер</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Местоположение</label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value as Region)}
                  className="px-4 py-2 border rounded-lg bg-white"
                >
                  <option value="moscow">Москва</option>
                  <option value="spb">Санкт-Петербург</option>
                  <option value="russia">Вся Россия</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {currentPage === 'calc' && <CalculatorPage />}
        {currentPage === 'methodology' && <MethodologyPage />}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'contacts' && <ContactsPage />}

        <footer className="mt-20 pt-12 border-t text-center">
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <button onClick={() => setCurrentPage('methodology')} className="hover:text-blue-600">
              Методология
            </button>
            <button onClick={() => setCurrentPage('about')} className="hover:text-blue-600">
              О проекте
            </button>
            <button onClick={() => setCurrentPage('contacts')} className="hover:text-blue-600">
              Контакты
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Данные: {new Date(data.meta.updated_at).toLocaleDateString('ru-RU')}
          </div>
        </footer>
      </main>

      {showOnboarding && step < steps.length && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowOnboarding(false)} />
          <div className="fixed z-50 bg-white rounded-xl shadow-2xl p-6 max-w-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg font-bold">{steps[step].title}</h3>
              <button onClick={() => setShowOnboarding(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-gray-600 mb-4">{steps[step].text}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{step + 1} из {steps.length}</span>
              <button
                onClick={() => step < steps.length - 1 ? setStep(step + 1) : setShowOnboarding(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {step < steps.length - 1 ? 'Далее' : 'Понятно!'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
