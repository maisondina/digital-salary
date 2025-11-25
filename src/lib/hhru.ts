// HH.ru API Configuration
const HH_CONFIG = {
  CLIENT_ID: 'L3CLEES8LPH30SES0R0AMTJQ3NC7AIF97O1VTCG5UDE1K2AHF7TTS6F1IU8JFCFG',
  CLIENT_SECRET: 'H5K7T7P2G8CBCA9D4U072VAV1MA3LMJ91DF2VAAQIEHCQL94VI37NQA78FRMMIAF',
  BASE_URL: 'https://api.hh.ru',
  MAX_PAGES: 20,
  PER_PAGE: 100,
  REQUEST_DELAY_MS: 300,
} as const

// ============================================
// ТИПЫ
// ============================================

export interface HHSalary {
  from: number | null
  to: number | null
  currency: string
  gross: boolean
}

export interface HHVacancy {
  id: string
  name: string
  salary: HHSalary | null
  area: {
    id: string
    name: string
  }
  employer: {
    id: string
    name: string
  }
  snippet?: {
    requirement?: string
    responsibility?: string
  }
  published_at: string
}

export interface HHVacanciesResponse {
  items: HHVacancy[]
  found: number
  pages: number
  page: number
  per_page: number
}

export interface SkillAnalysis {
  name: string
  count: number
  median_with_skill: number
  median_without_skill: number
  salary_impact: number
}

export interface RegionalData {
  median_salary: number
  vacancy_count: number
}

export interface RegionalSalaries {
  moscow: RegionalData | null
  spb: RegionalData | null
  russia: RegionalData | null
}

export interface ProfessionAnalysis {
  skills: SkillAnalysis[]
  regional_salaries: RegionalSalaries
  base_salary: number
  total_vacancies: number
  updated_at: string
}

export const AREAS = {
  MOSCOW: '1',
  SPB: '2',
  RUSSIA: '113',
} as const

// ============================================
// СПИСОК НАВЫКОВ ДЛЯ КОПИРАЙТЕРА
// ============================================

const COPYWRITER_SKILLS = [
  { name: 'SEO', searchTerms: ['SEO', 'сео', 'поисковая оптимизация'] },
  { name: 'SMM', searchTerms: ['SMM', 'соцсети', 'социальные сети'] },
  { name: 'Email-маркетинг', searchTerms: ['email', 'рассылк', 'newsletter'] },
  { name: 'Контент-маркетинг', searchTerms: ['контент-маркетинг', 'content marketing'] },
  { name: 'UX-writing', searchTerms: ['UX', 'UX-writing', 'UX-райтинг', 'интерфейс'] },
  { name: 'Лендинги', searchTerms: ['лендинг', 'landing', 'посадочн'] },
  { name: 'Сторителлинг', searchTerms: ['сторителлинг', 'storytelling', 'истори'] },
  { name: 'Редактура', searchTerms: ['редактур', 'редактор', 'корректур'] },
  { name: 'Техническое писательство', searchTerms: ['техническ', 'technical writing', 'документаци'] },
  { name: 'Нейминг', searchTerms: ['нейминг', 'naming', 'название', 'слоган'] },
  { name: 'Figma', searchTerms: ['figma', 'фигма'] },
  { name: 'Tilda', searchTerms: ['tilda', 'тильда'] },
  { name: 'WordPress', searchTerms: ['wordpress', 'вордпресс'] },
  { name: 'Английский язык', searchTerms: ['english', 'английск', 'англ.'] },
  { name: 'Аналитика', searchTerms: ['аналитик', 'метрик', 'analytics', 'яндекс.метрик'] },
]

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  }
  return Math.round(sorted[mid])
}

function normalizeSalary(salary: HHSalary | null): number | null {
  if (!salary) return null
  if (salary.currency !== 'RUR' && salary.currency !== 'RUB') return null

  let amount: number | null = null

  if (salary.from && salary.to) {
    amount = salary.from + (salary.to - salary.from) * 0.35
  } else if (salary.from) {
    amount = salary.from * 1.25
  } else {
    return null
  }

  if (!amount) return null
  if (salary.gross) {
    amount = amount * 0.87
  }

  return Math.round(amount)
}

// Фильтрация мусора
const AGENCY_KEYWORDS = ['кадров', 'рекрутинг', 'hr ', 'personnel', 'staffing', 'подбор персонала', 'агентство']

function isValidVacancy(vacancy: HHVacancy): boolean {
  if (!vacancy.salary) return false
  if (!vacancy.salary.from && vacancy.salary.to) return false
  
  const currency = vacancy.salary.currency
  if (currency !== 'RUR' && currency !== 'RUB') return false
  
  const employerName = vacancy.employer.name.toLowerCase()
  if (AGENCY_KEYWORDS.some(kw => employerName.includes(kw))) return false
  
  return true
}

// ============================================
// СБОР ВАКАНСИЙ
// ============================================

async function fetchVacanciesWithQuery(
  query: string,
  area?: string,
  maxPages: number = 5
): Promise<number[]> {
  const salaries: number[] = []
  let page = 0
  let totalPages = 1

  while (page < totalPages && page < maxPages) {
    try {
      const params = new URLSearchParams({
        text: query,
        per_page: String(HH_CONFIG.PER_PAGE),
        page: String(page),
        only_with_salary: 'true',
        period: '30',
      })

      if (area) {
        params.append('area', area)
      }

      const response = await fetch(`${HH_CONFIG.BASE_URL}/vacancies?${params}`, {
        headers: {
          'User-Agent': 'DigitalSalary/1.0 (salary calculator)',
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          await delay(2000)
          continue
        }
        break
      }

      const data: HHVacanciesResponse = await response.json()
      totalPages = Math.min(data.pages, maxPages)

      data.items
        .filter(isValidVacancy)
        .forEach(vacancy => {
          const salary = normalizeSalary(vacancy.salary)
          if (salary) salaries.push(salary)
        })

      page++
      if (page < totalPages) await delay(HH_CONFIG.REQUEST_DELAY_MS)
    } catch {
      break
    }
  }

  return salaries
}

// ============================================
// АНАЛИЗ НАВЫКОВ
// ============================================

async function analyzeSkillImpact(
  profession: string,
  skill: { name: string; searchTerms: string[] },
  baseSalaries: number[],
  area?: string
): Promise<SkillAnalysis | null> {
  // Ищем вакансии с этим навыком
  const searchQuery = `${profession} ${skill.searchTerms[0]}`
  const skillSalaries = await fetchVacanciesWithQuery(searchQuery, area, 3)

  if (skillSalaries.length < 10) {
    return null // Слишком мало данных
  }

  const medianWith = calculateMedian(skillSalaries)
  const medianWithout = calculateMedian(baseSalaries)
  const impact = medianWith - medianWithout

  return {
    name: skill.name,
    count: skillSalaries.length,
    median_with_skill: medianWith,
    median_without_skill: medianWithout,
    salary_impact: impact,
  }
}

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ
// ============================================

export async function analyzeProfession(profession: string): Promise<ProfessionAnalysis> {
  console.log('═'.repeat(60))
  console.log(`🚀 АНАЛИЗ ПРОФЕССИИ: ${profession.toUpperCase()}`)
  console.log('═'.repeat(60))

  // 1. Собираем базовые вакансии по всей России
  console.log('\n📊 Собираю базовые вакансии по России...')
  const russiaSalaries = await fetchVacanciesWithQuery(profession, AREAS.RUSSIA, 20)
  console.log(`   ✅ Собрано: ${russiaSalaries.length} вакансий`)

  const baseSalary = calculateMedian(russiaSalaries)
  console.log(`   💰 Базовая медиана: ${baseSalary.toLocaleString('ru-RU')} ₽`)

  // 2. Собираем по регионам
  console.log('\n📍 Собираю данные по регионам...')
  
  console.log('   🏙️ Москва...')
  const moscowSalaries = await fetchVacanciesWithQuery(profession, AREAS.MOSCOW, 10)
  console.log(`      ✅ ${moscowSalaries.length} вакансий`)
  
  console.log('   🏙️ Санкт-Петербург...')
  const spbSalaries = await fetchVacanciesWithQuery(profession, AREAS.SPB, 10)
  console.log(`      ✅ ${spbSalaries.length} вакансий`)

  const regionalSalaries: RegionalSalaries = {
    moscow: moscowSalaries.length > 0 ? {
      median_salary: calculateMedian(moscowSalaries),
      vacancy_count: moscowSalaries.length,
    } : null,
    spb: spbSalaries.length > 0 ? {
      median_salary: calculateMedian(spbSalaries),
      vacancy_count: spbSalaries.length,
    } : null,
    russia: {
      median_salary: baseSalary,
      vacancy_count: russiaSalaries.length,
    },
  }

  // 3. Анализируем навыки
  console.log('\n🎯 Анализирую влияние навыков...')
  const skills: SkillAnalysis[] = []

  for (const skill of COPYWRITER_SKILLS) {
    process.stdout.write(`   ${skill.name}... `)
    const analysis = await analyzeSkillImpact(profession, skill, russiaSalaries, AREAS.RUSSIA)
    
    if (analysis) {
      skills.push(analysis)
      const sign = analysis.salary_impact >= 0 ? '+' : ''
      console.log(`✅ ${analysis.count} вакансий, ${sign}${analysis.salary_impact.toLocaleString('ru-RU')} ₽`)
    } else {
      console.log('⏭️ мало данных')
    }
    
    await delay(500)
  }

  // Сортируем по влиянию на зарплату
  skills.sort((a, b) => b.salary_impact - a.salary_impact)

  // Берём топ-10
  const top10Skills = skills.slice(0, 10)

  // Выводим результаты
  console.log('\n' + '═'.repeat(60))
  console.log('📈 РЕЗУЛЬТАТЫ')
  console.log('═'.repeat(60))

  console.log(`\n💰 МЕДИАННЫЕ ЗАРПЛАТЫ:`)
  console.log(`   Вся Россия: ${baseSalary.toLocaleString('ru-RU')} ₽ (${russiaSalaries.length} вакансий)`)
  if (regionalSalaries.moscow) {
    console.log(`   Москва: ${regionalSalaries.moscow.median_salary.toLocaleString('ru-RU')} ₽ (${regionalSalaries.moscow.vacancy_count} вакансий)`)
  }
  if (regionalSalaries.spb) {
    console.log(`   СПб: ${regionalSalaries.spb.median_salary.toLocaleString('ru-RU')} ₽ (${regionalSalaries.spb.vacancy_count} вакансий)`)
  }

  console.log(`\n🎯 ТОП-${top10Skills.length} НАВЫКОВ ПО ВЛИЯНИЮ НА ЗАРПЛАТУ:`)
  top10Skills.forEach((skill, i) => {
    const sign = skill.salary_impact >= 0 ? '+' : ''
    console.log(`   ${i + 1}. ${skill.name}: ${sign}${skill.salary_impact.toLocaleString('ru-RU')} ₽ (${skill.count} вакансий)`)
  })

  return {
    skills: top10Skills,
    regional_salaries: regionalSalaries,
    base_salary: baseSalary,
    total_vacancies: russiaSalaries.length,
    updated_at: new Date().toISOString(),
  }
}
