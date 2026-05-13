'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

// ============================================
// ТИПЫ ДАННЫХ
// ============================================

type SkillLevel = 'basic' | 'confident' | 'expert' | null
type Region = 'moscow' | 'spb' | 'russia'

interface SkillLevelData {
  name: string
  description: string
  salary_impact: number
}

interface SkillConfig {
  id: string
  name: string
  icon: string
  levels: {
    basic: SkillLevelData
    confident: SkillLevelData
    expert: SkillLevelData
  }
}

interface RegionConfig {
  name: string
  median_salary: number
  vacancy_count: number
}

interface ProfessionData {
  profession: string
  base_salary: number
  description?: string
  regions: {
    moscow: RegionConfig
    spb: RegionConfig
    russia: RegionConfig
  }
  skills: SkillConfig[]
  meta: {
    updated_at: string
    total_vacancies: number
    data_source: string
  }
}

const PROFESSIONS = ['Копирайтер', 'SMM-специалист', 'Таргетолог', 'SEO-специалист']

const REGION_LABELS: Record<Region, string> = {
  moscow: 'Москва',
  spb: 'Санкт-Петербург',
  russia: 'Вся Россия',
}

const REGION_NAMES: Record<Region, string> = {
  moscow: 'Москве',
  spb: 'Санкт-Петербурге',
  russia: 'России',
}

const LEVELS: Array<'basic' | 'confident' | 'expert'> = ['basic', 'confident', 'expert']

// ============================================
// КОМПОНЕНТ
// ============================================

export default function SalaryCalculator() {
  const [profession, setProfession] = useState('Копирайтер')
  const [region, setRegion] = useState<Region>('moscow')
  const [data, setData] = useState<ProfessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [skills, setSkills] = useState<Record<string, SkillLevel>>({})
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)
  const [hoveredLevel, setHoveredLevel] = useState<number>(-1)

  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  // Загрузка данных по профессии
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setErrorMessage('')

    fetch(`/api/salary?profession=${encodeURIComponent(profession)}`)
      .then(async (res) => {
        const body = await res.json()
        if (cancelled) return

        if (body.success) {
          setData(body.data)
          setSkills({}) // сбрасываем выбранные навыки при смене профессии
        } else {
          setData(null)
          setError(body.error || 'unknown')
          setErrorMessage(body.message || 'Не удалось загрузить данные')
        }
      })
      .catch(() => {
        if (cancelled) return
        setData(null)
        setError('network')
        setErrorMessage('Ошибка соединения с сервером')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profession])

  // Закрытие дропдаунов при клике вне области шапки
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (headerRef.current && !headerRef.current.contains(target)) {
        setShowProfessionDropdown(false)
        setShowRegionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Расчёт итоговой зарплаты
  const calculateSalary = useCallback((): number => {
    if (!data) return 0
    const regionData = data.regions[region]
    let total = regionData.median_salary

    Object.entries(skills).forEach(([id, level]) => {
      if (level) {
        const skill = data.skills.find((s) => s.id === id)
        if (skill) {
          total += skill.levels[level].salary_impact
        }
      }
    })

    return total
  }, [data, region, skills])

  const selectedSkillsCount = Object.values(skills).filter(Boolean).length

  const getSubtitle = (): string => {
    if (!data) return ''
    const regionData = data.regions[region]

    if (selectedSkillsCount > 0) {
      return `Ваша рыночная стоимость в ${REGION_NAMES[region]}`
    }
    return `Медианная зарплата по профессии «${data.profession}» в ${REGION_NAMES[region]} на основе ${regionData.vacancy_count.toLocaleString('ru-RU')} вакансий`
  }

  const setSkillLevel = useCallback((skillId: string, level: SkillLevel) => {
    setSkills((prev) => {
      if (prev[skillId] === level) {
        const next = { ...prev }
        delete next[skillId]
        return next
      }
      return { ...prev, [skillId]: level }
    })
  }, [])

  const resetSkill = useCallback((skillId: string) => {
    setSkills((prev) => {
      const next = { ...prev }
      delete next[skillId]
      return next
    })
  }, [])

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // ----- Кастомный дропдаун -----
  const CustomDropdown = ({
    label,
    value,
    options,
    isOpen,
    onToggle,
    onChange,
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
        onClick={() => onToggle()}
        className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors min-w-[180px] text-left"
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
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                onToggle()
              }}
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

  // ============================================
  // РЕНДЕР
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка с дропдаунами */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div ref={headerRef} className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">Digital Salary</h1>
            <p className="text-sm text-gray-500">Калькулятор зарплат</p>
          </div>

          <div className="flex gap-4 flex-wrap">
            <CustomDropdown
              label="Профессия"
              value={profession}
              options={PROFESSIONS.map((p) => ({ value: p, label: p }))}
              isOpen={showProfessionDropdown}
              onToggle={() => {
                setShowProfessionDropdown(!showProfessionDropdown)
                setShowRegionDropdown(false)
              }}
              onChange={(value) => setProfession(value)}
            />
            <CustomDropdown
              label="Местоположение"
              value={REGION_LABELS[region]}
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Состояние «загрузка» */}
        {loading && (
          <div className="text-center py-20">
            <div className="text-2xl text-gray-400">Загружаем данные…</div>
          </div>
        )}

        {/* Состояние «нет данных по профессии» */}
        {!loading && error === 'no_data' && (
          <div className="text-center py-20 max-w-xl mx-auto">
            <div className="text-5xl mb-6">📊</div>
            <div className="text-2xl font-bold text-gray-800 mb-3">
              Скоро добавим
            </div>
            <div className="text-gray-600 mb-6">
              По профессии «{profession}» данные ещё собираются. Пока попробуйте калькулятор для другой профессии — например, копирайтера.
            </div>
            <button
              onClick={() => setProfession('Копирайтер')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Открыть копирайтера
            </button>
          </div>
        )}

        {/* Состояние «другая ошибка» */}
        {!loading && error && error !== 'no_data' && (
          <div className="text-center py-20 max-w-xl mx-auto">
            <div className="text-5xl mb-6">⚠️</div>
            <div className="text-2xl font-bold text-gray-800 mb-3">Что-то пошло не так</div>
            <div className="text-gray-600">{errorMessage}</div>
          </div>
        )}

        {/* Основной контент — калькулятор */}
        {!loading && !error && data && (
          <>
            {/* Большая цифра зарплаты */}
            <div className="text-center mb-16">
              <div className="text-7xl md:text-8xl font-bold mb-4 text-gray-900">
                {calculateSalary().toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-xl text-gray-600 mb-2">в месяц до вычета налогов</div>
              <div className="text-sm text-gray-500">{getSubtitle()}</div>

              {selectedSkillsCount === 0 && data.skills.length > 0 && (
                <div className="mt-6 text-blue-600 font-medium text-lg">
                  👇 Добавьте навыки, чтобы увидеть свою стоимость
                </div>
              )}
            </div>

            {/* Сетка навыков */}
            {data.skills.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mb-8 text-center">Ваши навыки</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.skills.map((skill) => {
                    const selectedLevel = skills[skill.id]
                    const isSelected = !!selectedLevel
                    const selectedLevelIndex = selectedLevel ? LEVELS.indexOf(selectedLevel) : -1

                    return (
                      <div
                        key={skill.id}
                        className={`
                          border-2 rounded-xl p-5 transition-all
                          ${
                            isSelected
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
                          {LEVELS.map((lvl, idx) => {
                            const isFilledBySelection = selectedLevelIndex >= idx
                            const isFilledByHover =
                              hoveredSkill === skill.id && hoveredLevel >= idx
                            const isFilled = isFilledBySelection || isFilledByHover
                            const isHoveredStar =
                              hoveredSkill === skill.id && hoveredLevel === idx

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
                                  aria-label={`${skill.name} — ${skill.levels[lvl].name}`}
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
            ) : (
              <div className="text-center text-gray-500 py-10">
                Навыки по этой профессии ещё анализируем.
              </div>
            )}

            {/* Футер */}
            <footer className="mt-20 pt-12 border-t text-center">
              <div className="flex justify-center gap-8 text-sm text-gray-500">
                <Link href="/about" className="hover:text-blue-600 transition-colors">
                  О проекте
                </Link>
                <Link href="/author" className="hover:text-blue-600 transition-colors">
                  Автор
                </Link>
                <a
                  href="https://github.com/maisondina/digital-salary"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  GitHub
                </a>
              </div>
              <div className="mt-4 text-xs text-gray-400">
                Источник: {data.meta.data_source}. Данные обновлены: {formatDate(data.meta.updated_at)}
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  )
}
