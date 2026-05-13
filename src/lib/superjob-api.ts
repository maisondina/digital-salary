// SuperJob API Configuration
// Секретный ключ читаем из переменных окружения, чтобы не светить его в публичном репо.
// Локально — кладём в .env.local. На Vercel — в Project Settings → Environment Variables.
const SUPERJOB_SECRET_KEY = process.env.SUPERJOB_SECRET_KEY

if (!SUPERJOB_SECRET_KEY) {
  throw new Error(
    'SUPERJOB_SECRET_KEY не задан. Положи ключ в .env.local или Environment Variables на Vercel.'
  )
}

const SUPERJOB_CONFIG = {
  SECRET_KEY: SUPERJOB_SECRET_KEY,
  BASE_URL: 'https://api.superjob.ru/2.0',
  MAX_PER_PAGE: 100,
  REQUEST_DELAY_MS: 600, // 120 запросов в минуту = 1 запрос в 500мс, берём с запасом
} as const

// Коды городов SuperJob
export const TOWNS = {
  MOSCOW: 4,
  SPB: 14,
  // Для всей России просто не указываем town
} as const

// ============================================
// ТИПЫ
// ============================================

export interface SuperJobVacancy {
  id: number
  profession: string
  payment_from: number
  payment_to: number
  currency: string
  agreement: boolean // true = зарплата по договорённости
  town: {
    id: number
    title: string
  }
  client: {
    id: number
    title: string
  }
  work: string // описание обязанностей
  candidat: string // требования к кандидату
  type_of_work: {
    id: number
    title: string
  }
  experience: {
    id: number
    title: string
  }
  date_published: number
}

export interface SuperJobResponse {
  objects: SuperJobVacancy[]
  total: number
  more: boolean
}

export interface ProcessedVacancy {
  id: number
  profession: string
  salary: number // нормализованная зарплата
  salaryFrom: number
  salaryTo: number
  town: string
  townId: number
  employer: string
  skills: string[] // навыки, найденные в тексте
}

export interface SkillAnalysis {
  name: string
  count: number
  medianWithSkill: number
  medianWithoutSkill: number
  salaryImpact: number // разница в рублях
}

export interface RegionalData {
  medianSalary: number
  vacancyCount: number
}

export interface RegionalSalaries {
  moscow: RegionalData | null
  spb: RegionalData | null
  russia: RegionalData | null
}

// ============================================
// СПИСОК НАВЫКОВ ДЛЯ ПОИСКА В ТЕКСТЕ
// ============================================

// Навыки, общие для всех профессий
const COMMON_SKILLS = [
  { keywords: ['english', 'англ', 'английск'], name: 'Английский язык' },
  { keywords: ['аналитик', 'метрик', 'яндекс.метрика', 'google analytics', 'анализ'], name: 'Аналитика' },
  { keywords: ['chatgpt', 'gpt', 'нейросет', 'ии', 'ai', 'искусственн'], name: 'Работа с ИИ' },
]

// Навыки по профессиям
const SKILLS_BY_PROFESSION: Record<string, { keywords: string[], name: string }[]> = {
  'копирайтер': [
    { keywords: ['seo', 'сео', 'поисковая оптимизация'], name: 'SEO-копирайтинг' },
    { keywords: ['ux', 'ux-тексты', 'ux-редактура', 'ux writing', 'юикс'], name: 'UX-редактура' },
    { keywords: ['техническ', 'technical writing', 'техпис', 'технический писатель'], name: 'Техническое писательство' },
    { keywords: ['smm', 'соцсет', 'социальн', 'вконтакте', 'telegram', 'телеграм'], name: 'SMM и соцсети' },
    { keywords: ['email', 'e-mail', 'рассылк', 'newsletter', 'письма'], name: 'Email-маркетинг' },
    { keywords: ['лендинг', 'landing', 'посадочн'], name: 'Создание лендингов' },
    { keywords: ['tilda', 'тильда', 'конструктор', 'wix', 'readymag'], name: 'Работа с конструкторами сайтов' },
    { keywords: ['редактур', 'редактор', 'корректур', 'вычитк'], name: 'Редактура и корректура' },
    { keywords: ['креатив', 'creative', 'слоган', 'нейминг', 'naming'], name: 'Креативный копирайтинг' },
    { keywords: ['б2б', 'b2b', 'бизнес'], name: 'B2B-копирайтинг' },
    { keywords: ['контент-план', 'контент план', 'стратеги'], name: 'Контент-стратегия' },
    { keywords: ['figma', 'фигма', 'photoshop', 'фотошоп', 'canva'], name: 'Работа с графикой' },
  ],
  'smm менеджер': [
    { keywords: ['контент-план', 'контент план', 'стратеги'], name: 'Контент-стратегия' },
    { keywords: ['таргет', 'target', 'рекламн'], name: 'Таргетированная реклама' },
    { keywords: ['копирайт', 'текст', 'пост'], name: 'Копирайтинг' },
    { keywords: ['видео', 'reels', 'рилс', 'монтаж'], name: 'Видео и Reels' },
    { keywords: ['stories', 'сторис', 'стори'], name: 'Stories и визуал' },
    { keywords: ['figma', 'фигма', 'canva', 'photoshop', 'фотошоп', 'график'], name: 'Работа с графикой' },
    { keywords: ['influence', 'блогер', 'инфлюенс', 'лидер мнений'], name: 'Работа с блогерами' },
    { keywords: ['telegram', 'телеграм', 'тг'], name: 'Telegram-маркетинг' },
    { keywords: ['vk', 'вк', 'вконтакте'], name: 'VK-маркетинг' },
    { keywords: ['email', 'e-mail', 'рассылк'], name: 'Email-маркетинг' },
    { keywords: ['комьюнити', 'community', 'сообщество', 'модерац'], name: 'Комьюнити-менеджмент' },
    { keywords: ['seo', 'сео', 'поисковая'], name: 'SEO-основы' },
  ],
  'таргетолог': [
    { keywords: ['vk', 'вк', 'вконтакте'], name: 'VK Реклама' },
    { keywords: ['яндекс', 'yandex', 'директ'], name: 'Яндекс.Директ' },
    { keywords: ['google', 'гугл', 'google ads'], name: 'Google Ads' },
    { keywords: ['telegram', 'телеграм', 'tg ads'], name: 'Telegram Ads' },
    { keywords: ['креатив', 'баннер', 'визуал'], name: 'Создание креативов' },
    { keywords: ['контекстн', 'поисков'], name: 'Контекстная реклама' },
    { keywords: ['ретаргет', 'ремаркет', 'look-alike', 'lookalike'], name: 'Ретаргетинг' },
    { keywords: ['figma', 'canva', 'photoshop', 'график'], name: 'Работа с графикой' },
    { keywords: ['a/b', 'аб-тест', 'тестирован'], name: 'A/B-тестирование' },
    { keywords: ['воронк', 'лид', 'конверси'], name: 'Воронки продаж' },
    { keywords: ['mytarget', 'майтаргет'], name: 'myTarget' },
    { keywords: ['excel', 'таблиц', 'отчёт', 'отчет', 'report'], name: 'Отчётность и Excel' },
  ],
  'seo специалист': [
    { keywords: ['семантик', 'семантическ', 'ядро', 'кластериз'], name: 'Семантическое ядро' },
    { keywords: ['линкбилд', 'ссылочн', 'ссылк', 'link building'], name: 'Линкбилдинг' },
    { keywords: ['техническ', 'technical', 'аудит', 'crawl'], name: 'Технический SEO-аудит' },
    { keywords: ['контент', 'текст', 'копирайт', 'стать'], name: 'SEO-контент' },
    { keywords: ['яндекс', 'yandex', 'метрик'], name: 'Яндекс.Метрика и Вебмастер' },
    { keywords: ['google', 'гугл', 'search console', 'ga4'], name: 'Google Analytics и Search Console' },
    { keywords: ['wordpress', 'вордпресс', 'cms', 'битрикс', 'тильда', 'tilda'], name: 'Работа с CMS' },
    { keywords: ['коммерческ', 'фактор', 'ранжирован'], name: 'Коммерческие факторы' },
    { keywords: ['локальн', 'local', 'региональн'], name: 'Локальное SEO' },
    { keywords: ['python', 'программ', 'парс', 'скрипт', 'автоматизац'], name: 'Автоматизация и парсинг' },
    { keywords: ['ahrefs', 'serpstat', 'semrush', 'keys.so'], name: 'SEO-инструменты' },
    { keywords: ['e-commerce', 'магазин', 'ecommerce', 'товар'], name: 'SEO для e-commerce' },
  ],
}

function getSkillsForProfession(keyword: string): { keywords: string[], name: string }[] {
  const lowerKeyword = keyword.toLowerCase()
  const professionSkills = SKILLS_BY_PROFESSION[lowerKeyword] || SKILLS_BY_PROFESSION['копирайтер']
  return [...professionSkills, ...COMMON_SKILLS]
}

// Дефолтный список для обратной совместимости
const SKILLS_TO_FIND = getSkillsForProfession('копирайтер')

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateSalary(from: number, to: number): number {
  // Если указаны оба значения — берём from + (to - from) * 0.35
  if (from > 0 && to > 0) {
    return Math.round(from + (to - from) * 0.35)
  }
  // Если только "от" — берём это значение
  if (from > 0) return from
  // Если только "до" — берём 70% от него
  if (to > 0) return Math.round(to * 0.7)
  return 0
}

function findSkillsInText(text: string, professionKeyword?: string): string[] {
  if (!text) return []
  const lowerText = text.toLowerCase()
  const foundSkills: string[] = []
  const skillsList = professionKeyword ? getSkillsForProfession(professionKeyword) : SKILLS_TO_FIND

  for (const skill of skillsList) {
    for (const keyword of skill.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!foundSkills.includes(skill.name)) {
          foundSkills.push(skill.name)
        }
        break
      }
    }
  }

  return foundSkills
}

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function isAgencyVacancy(vacancy: SuperJobVacancy): boolean {
  const agencyKeywords = ['кадров', 'рекрутинг', 'hr-агент', 'подбор персонала', 'хедхант']
  const employerName = vacancy.client?.title?.toLowerCase() || ''
  return agencyKeywords.some(keyword => employerName.includes(keyword))
}

// ============================================
// ОСНОВНЫЕ ФУНКЦИИ API
// ============================================

export async function fetchVacancies(
  keyword: string,
  townId?: number,
  page: number = 0
): Promise<SuperJobResponse> {
  const params = new URLSearchParams({
    keyword: keyword,
    count: String(SUPERJOB_CONFIG.MAX_PER_PAGE),
    page: String(page),
    no_agreement: '1', // только с указанной зарплатой
  })

  if (townId) {
    params.append('town', String(townId))
  }

  const url = `${SUPERJOB_CONFIG.BASE_URL}/vacancies/?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'X-Api-App-Id': SUPERJOB_CONFIG.SECRET_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`SuperJob API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function fetchAllVacancies(
  keyword: string,
  townId?: number
): Promise<ProcessedVacancy[]> {
  const allVacancies: ProcessedVacancy[] = []
  let page = 0
  let hasMore = true

  console.log(`Загружаем вакансии "${keyword}"${townId ? ` в городе ${townId}` : ' по всей России'}...`)

  while (hasMore) {
    try {
      const response = await fetchVacancies(keyword, townId, page)

      for (const vacancy of response.objects) {
        // Пропускаем вакансии агентств
        if (isAgencyVacancy(vacancy)) continue

        // Пропускаем вакансии без зарплаты
        if (vacancy.agreement) continue
        if (vacancy.payment_from === 0 && vacancy.payment_to === 0) continue

        const salary = calculateSalary(vacancy.payment_from, vacancy.payment_to)
        if (salary === 0) continue

        // Ищем навыки в тексте вакансии
        const fullText = `${vacancy.profession} ${vacancy.work || ''} ${vacancy.candidat || ''}`
        const skills = findSkillsInText(fullText, keyword)

        allVacancies.push({
          id: vacancy.id,
          profession: vacancy.profession,
          salary,
          salaryFrom: vacancy.payment_from,
          salaryTo: vacancy.payment_to,
          town: vacancy.town?.title || 'Не указан',
          townId: vacancy.town?.id || 0,
          employer: vacancy.client?.title || 'Не указан',
          skills,
        })
      }

      hasMore = response.more && page < 20 // ограничиваем 20 страницами (2000 вакансий)
      page++

      console.log(`  Страница ${page}: загружено ${response.objects.length}, всего обработано ${allVacancies.length}`)

      // Задержка между запросами
      if (hasMore) {
        await delay(SUPERJOB_CONFIG.REQUEST_DELAY_MS)
      }
    } catch (error) {
      console.error(`Ошибка на странице ${page}:`, error)
      break
    }
  }

  console.log(`Готово! Найдено ${allVacancies.length} вакансий с зарплатой`)
  return allVacancies
}

export function analyzeSkills(vacancies: ProcessedVacancy[], professionKeyword?: string): SkillAnalysis[] {
  const skillsList = professionKeyword ? getSkillsForProfession(professionKeyword) : SKILLS_TO_FIND
  const skillStats: Map<string, { withSkill: number[]; withoutSkill: number[] }> = new Map()

  // Инициализируем статистику для всех навыков
  for (const skill of skillsList) {
    skillStats.set(skill.name, { withSkill: [], withoutSkill: [] })
  }

  // Собираем зарплаты
  for (const vacancy of vacancies) {
    for (const skill of skillsList) {
      const stats = skillStats.get(skill.name)!
      if (vacancy.skills.includes(skill.name)) {
        stats.withSkill.push(vacancy.salary)
      } else {
        stats.withoutSkill.push(vacancy.salary)
      }
    }
  }

  // Считаем медианы и сортируем по количеству упоминаний
  const results: SkillAnalysis[] = []

  skillStats.forEach((stats, name) => {
    if (stats.withSkill.length >= 3) { // минимум 3 вакансии с навыком
      const medianWith = calculateMedian(stats.withSkill)
      const medianWithout = calculateMedian(stats.withoutSkill)

      results.push({
        name,
        count: stats.withSkill.length,
        medianWithSkill: medianWith,
        medianWithoutSkill: medianWithout,
        salaryImpact: medianWith - medianWithout,
      })
    }
  })

  // Сортируем по количеству упоминаний
  return results.sort((a, b) => b.count - a.count).slice(0, 10)
}

export async function getRegionalSalaries(keyword: string): Promise<RegionalSalaries> {
  const results: RegionalSalaries = {
    moscow: null,
    spb: null,
    russia: null,
  }

  // Москва
  console.log('\n📍 Загружаем данные по Москве...')
  const moscowVacancies = await fetchAllVacancies(keyword, TOWNS.MOSCOW)
  if (moscowVacancies.length > 0) {
    results.moscow = {
      medianSalary: calculateMedian(moscowVacancies.map(v => v.salary)),
      vacancyCount: moscowVacancies.length,
    }
  }

  await delay(1000)

  // Санкт-Петербург
  console.log('\n📍 Загружаем данные по Санкт-Петербургу...')
  const spbVacancies = await fetchAllVacancies(keyword, TOWNS.SPB)
  if (spbVacancies.length > 0) {
    results.spb = {
      medianSalary: calculateMedian(spbVacancies.map(v => v.salary)),
      vacancyCount: spbVacancies.length,
    }
  }

  await delay(1000)

  // Вся Россия
  console.log('\n📍 Загружаем данные по всей России...')
  const russiaVacancies = await fetchAllVacancies(keyword)
  if (russiaVacancies.length > 0) {
    results.russia = {
      medianSalary: calculateMedian(russiaVacancies.map(v => v.salary)),
      vacancyCount: russiaVacancies.length,
    }
  }

  return results
}

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ ДЛЯ АНАЛИЗА ПРОФЕССИИ
// ============================================

export async function analyzeProfession(keyword: string) {
  console.log(`\n🔍 Анализируем профессию: "${keyword}"\n`)

  // Собираем все вакансии по России для анализа навыков
  const allVacancies = await fetchAllVacancies(keyword)

  // Анализируем навыки
  const skills = analyzeSkills(allVacancies)

  // Получаем региональные данные
  const regionalSalaries = await getRegionalSalaries(keyword)

  return {
    keyword,
    totalVacancies: allVacancies.length,
    skills,
    regionalSalaries,
    updatedAt: new Date().toISOString(),
  }
}
