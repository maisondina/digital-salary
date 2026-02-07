'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SkillData {
  name: string
  count: number
  medianWithSkill: number
  salaryImpact: number
}

interface ApiResponse {
  success: boolean
  error?: string
  data: {
    profession: string
    city: string
    medianSalary: number
    vacancyCount: number
    skills: SkillData[]
    updatedAt: string
  } | null
}

const CITIES = ['Москва', 'Санкт-Петербург', 'Россия']
const PROFESSIONS = ['Копирайтер', 'SMM-специалист', 'Таргетолог', 'SEO-специалист']

export default function Home() {
  const [profession, setProfession] = useState('Копирайтер')
  const [city, setCity] = useState('Москва')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [medianSalary, setMedianSalary] = useState<number>(0)
  const [vacancyCount, setVacancyCount] = useState<number>(0)
  const [skills, setSkills] = useState<SkillData[]>([])
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [updatedAt, setUpdatedAt] = useState<string>('')

  // Загрузка данных
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/salary?profession=${encodeURIComponent(profession)}&city=${encodeURIComponent(city)}`)
      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        setMedianSalary(result.data.medianSalary)
        setVacancyCount(result.data.vacancyCount)
        setSkills(result.data.skills)
        setUpdatedAt(result.data.updatedAt)
        setSelectedSkills(new Set())
      } else {
        setError(result.error || 'Не удалось загрузить данные')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [profession, city])

  // Расчёт итоговой зарплаты с учётом навыков
  const calculateTotalSalary = () => {
    let total = medianSalary
    for (const skill of skills) {
      if (selectedSkills.has(skill.name) && skill.salaryImpact > 0) {
        total += skill.salaryImpact
      }
    }
    return total
  }

  const toggleSkill = (skillName: string) => {
    const newSelected = new Set(selectedSkills)
    if (newSelected.has(skillName)) {
      newSelected.delete(skillName)
    } else {
      newSelected.add(skillName)
    }
    setSelectedSkills(newSelected)
  }

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(salary))
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Рейтинг навыка (1-3 звезды)
  const getSkillRating = (skill: SkillData) => {
    if (skill.salaryImpact > 15000) return 3
    if (skill.salaryImpact > 5000) return 2
    return 1
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Шапка */}
      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Digital Salary</h1>
            <p className="text-sm text-gray-500">Калькулятор зарплат</p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Селект профессии */}
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Селект города */}
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-4xl mx-auto">
        {/* Блок с зарплатой */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6 text-center">
          {loading ? (
            <div className="py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Загружаем данные с SuperJob...</p>
            </div>
          ) : error ? (
            <div className="py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <>
              <p className="text-6xl md:text-7xl font-bold text-green-500 mb-2">
                {formatSalary(calculateTotalSalary())} ₽
              </p>
              <p className="text-gray-500 mb-2">в месяц до вычета налогов</p>
              <p className="text-sm text-gray-400">
                Медиана по {vacancyCount} вакансиям &bull; {city}
              </p>
              {selectedSkills.size > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  +{formatSalary(calculateTotalSalary() - medianSalary)} ₽ за выбранные навыки
                </p>
              )}
            </>
          )}
        </div>

        {/* Навыки */}
        {!loading && !error && skills.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Навыки, влияющие на зарплату
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Выберите ваши навыки, чтобы увидеть их влияние на зарплату
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {skills.map((skill) => {
                const isSelected = selectedSkills.has(skill.name)
                const rating = getSkillRating(skill)

                return (
                  <button
                    key={skill.name}
                    onClick={() => toggleSkill(skill.name)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-green-50 border-2 border-green-500'
                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {skill.salaryImpact > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        +{formatSalary(skill.salaryImpact)} ₽
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {skill.count} вакансий
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Футер с информацией */}
        <footer className="mt-8 text-center text-sm text-gray-400">
          <p>Данные: SuperJob API</p>
          {updatedAt && <p>Обновлено: {formatDate(updatedAt)}</p>}
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/about" className="text-blue-500 hover:underline">О проекте</Link>
            <Link href="/author" className="text-blue-500 hover:underline">Автор</Link>
            <a
              href="https://github.com/maisondina/digital-salary"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              GitHub
            </a>
          </div>
        </footer>
      </main>

      {/* Онбординг */}
      {showOnboarding && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowOnboarding(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-xl z-50 max-w-sm w-full mx-4">
            <button
              onClick={() => setShowOnboarding(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            {onboardingStep === 1 && (
              <>
                <h3 className="font-semibold text-lg mb-2">1. Выберите профессию</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Доступны: копирайтер, SMM, таргетолог, SEO-специалист
                </p>
              </>
            )}

            {onboardingStep === 2 && (
              <>
                <h3 className="font-semibold text-lg mb-2">2. Выберите город</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Зарплаты отличаются в разных регионах
                </p>
              </>
            )}

            {onboardingStep === 3 && (
              <>
                <h3 className="font-semibold text-lg mb-2">3. Отметьте навыки</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Выберите навыки, которыми владеете, и узнайте свою рыночную стоимость
                </p>
              </>
            )}

            {onboardingStep === 4 && (
              <>
                <h3 className="font-semibold text-lg mb-2">Готово!</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Данные загружаются с SuperJob в реальном времени
                </p>
              </>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{onboardingStep} из 4</span>
              <button
                onClick={() => {
                  if (onboardingStep < 4) {
                    setOnboardingStep(onboardingStep + 1)
                  } else {
                    setShowOnboarding(false)
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                {onboardingStep < 4 ? 'Далее' : 'Понятно!'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
