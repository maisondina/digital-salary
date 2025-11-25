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
  const [hoveredLevel, setHoveredLevel] = useState<number>(-1)
  const [currentPage, setCurrentPage] = useState<Page>('calc')
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('visited')) {
      setShowOnboarding(true)
      localStorage.setItem('visited', '1')
    }
  }, [])

  // Закрытие дропдаунов при клике вне
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProfessionDropdown(false)
      setShowRegionDropdown(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const regionNames: Record<Region, string> = {
    moscow: 'Москве',
    spb: 'Санкт-Петербурге',
    russia: 'России'
  }

  const regionLabels: Record<Region, string> = {
    moscow: 'Москва',
    spb: 'Санкт-Петербург',
    russia: 'Вся Россия'
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

  // Кастомный дропдаун
  const CustomDropdown = ({ 
    label, 
    value, 
    options, 
    isOpen, 
    onToggle, 
    onChange 
  }: { 
    label: string
    value: string
    options: { value: string; label: string }[]
    isOpen: boolean
    onToggle: () => void
    onChange: (value: string) => void
  }) => (
    <div className="relative">
      <label className="block text-xs text-gray-500 mb-1.5 font-medium">{label}</label>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors min-w-[160px] text-left"
      >
        <span className="text-gray-900">{value}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(option.value); onToggle() }}
              className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                option.label === value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

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
            const selectedLevelIndex = selectedLevel ? levels.indexOf(selectedLevel) : -1

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
                    // Звезда закрашена если: выбрана эта или предыдущая, ИЛИ при наведении на эту или следующую
                    const isFilledBySelection = selectedLevelIndex >= idx
                    const isFilledByHover = hoveredSkill === skill.id && hoveredLevel >= idx
                    const isFilled = isFilledBySelection || isFilledByHover

                    const isHoveredStar = hoveredSkill === skill.id && hoveredLevel === idx

                    return (
                      <div
                        key={lvl}
                        className="relative"
                        onMouseEnter={() => {
                          setHoveredSkill(skill.id)
                          setHoveredLevel(idx)
                        }}
                        onMouseLeave={() => {
                          setHoveredSkill(null)
                          setHoveredLevel(-1)
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
                                : 'fill-gray-100 stroke-gray-300'
                            }`}
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>

                        {isHoveredStar && (
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

      <div className="space-y-6 text-gray-600">
        <p>
          Digital Salary анализирует тысячи актуальных вакансий с hh.ru и показывает,
          как различные навыки влияют на зарплату специалиста.
        </p>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Процесс расчёта</h2>
          <ol className="space-y-3 list-decimal list-inside">
            <li><strong>Собираем данные</strong> — анализируем все актуальные вакансии по профессии в России</li>
            <li><strong>Определяем базу</strong> — медианная зарплата по региону становится отправной точкой</li>
            <li><strong>Оцениваем навыки</strong> — сравниваем зарплаты в вакансиях с конкретным навыком и без него</li>
            <li><strong>Показываем результат</strong> — вы сразу видите свою рыночную стоимость</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Откуда данные</h2>
          <p>
            Все данные собираются через официальный API сервиса hh.ru — крупнейшей
            площадки по поиску работы в России.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Почему медиана, а не среднее?</h2>
          <p className="mb-3">
            <strong>Пример:</strong> 5 копирайтеров зарабатывают: 40k, 50k, 55k, 60k, 250k
          </p>
          <ul className="space-y-1">
            <li>• Среднее: 91k ₽ (искажено высокой зарплатой)</li>
            <li>• Медиана: 55k ₽ (реальная типичная зарплата)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ограничения</h2>
          <p>
            Калькулятор показывает рыночную оценку. Реальная зарплата зависит от опыта,
            компании, портфолио и переговорных навыков.
          </p>
        </div>
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

      <div className="space-y-6 text-gray-600">
        <p className="text-xl">
          Digital Salary — калькулятор рыночной стоимости диджитал-специалистов.
        </p>

        <p>
          Узнайте, сколько вы можете зарабатывать с вашим набором навыков —
          на основе реальных данных с hh.ru.
        </p>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Технологии</h2>
          <p>
            Создан с помощью <strong>Claude</strong> (Anthropic) — AI-ассистента.
            Next.js, TypeScript, API hh.ru.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Планы</h2>
          <ul className="space-y-1">
            <li>• Больше профессий</li>
            <li>• Учёт опыта работы</li>
            <li>• Динамика зарплат</li>
          </ul>
        </div>

        <p>
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

      <div className="space-y-6 text-gray-600">
        <p className="text-xl">
          <strong>Дина Майсон</strong> — UX-редактор
        </p>

        <p>
          Создала этот проект, чтобы помочь специалистам понять свою рыночную стоимость.
          Весь код написан в диалоге с Claude.
        </p>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Связь</h2>
          <p>
            Telegram:{' '}
            <a href="https://t.me/maisondina" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              @maisondina
            </a>
          </p>
          <p className="mt-2">
            Канал:{' '}
            <a href="https://t.me/+ZY7Np9Z9M95kMmY6" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              «Текст готов»
            </a>
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => setCurrentPage('calc')}>
            <h1 className="text-xl font-bold">Digital Salary</h1>
            <p className="text-sm text-gray-500">Калькулятор зарплат</p>
          </div>

          {currentPage === 'calc' && (
            <div className="flex gap-4">
              <CustomDropdown
                label="Профессия"
                value="Копирайтер"
                options={[{ value: 'copywriter', label: 'Копирайтер' }]}
                isOpen={showProfessionDropdown}
                onToggle={() => {
                  setShowProfessionDropdown(!showProfessionDropdown)
                  setShowRegionDropdown(false)
                }}
                onChange={() => {}}
              />
              <CustomDropdown
                label="Местоположение"
                value={regionLabels[region]}
                options={[
                  { value: 'moscow', label: 'Москва' },
                  { value: 'spb', label: 'Санкт-Петербург' },
                  { value: 'russia', label: 'Вся Россия' },
                ]}
                isOpen={showRegionDropdown}
                onToggle={() => {
                  setShowRegionDropdown(!showRegionDropdown)
                  setShowProfessionDropdown(false)
                }}
                onChange={(value) => setRegion(value as Region)}
              />
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
          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <button 
              onClick={() => setCurrentPage('methodology')} 
              className={`hover:text-blue-600 transition-colors ${currentPage === 'methodology' ? 'text-blue-600' : ''}`}
            >
              Методология
            </button>
            <button 
              onClick={() => setCurrentPage('about')} 
              className={`hover:text-blue-600 transition-colors ${currentPage === 'about' ? 'text-blue-600' : ''}`}
            >
              О проекте
            </button>
            <button 
              onClick={() => setCurrentPage('contacts')} 
              className={`hover:text-blue-600 transition-colors ${currentPage === 'contacts' ? 'text-blue-600' : ''}`}
            >
              Контакты
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Данные обновлены: {new Date(data.meta.updated_at).toLocaleDateString('ru-RU')}
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
