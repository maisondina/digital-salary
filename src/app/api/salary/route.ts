import { NextResponse } from 'next/server'

const SUPERJOB_CONFIG = {
  SECRET_KEY: 'v3.r.139552512.b6d973d11f790c053701b76739a69ba0b95681ab.0add4cac9dda8286bf8223c40ed8ebdaf36f115f',
  BASE_URL: 'https://api.superjob.ru/2.0',
}

const TOWNS: Record<string, number> = {
  'Москва': 4,
  'Санкт-Петербург': 14,
  'Россия': 0,
}

// Маппинг названий профессий на ключевые слова для API
const PROFESSION_KEYWORDS: Record<string, string> = {
  'Копирайтер': 'копирайтер',
  'SMM-специалист': 'SMM менеджер',
  'Таргетолог': 'таргетолог',
  'SEO-специалист': 'SEO специалист',
}

// Общие навыки
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
  ],
}

function getSkillsForProfession(keyword: string): { keywords: string[], name: string }[] {
  const lowerKeyword = keyword.toLowerCase()
  const professionSkills = SKILLS_BY_PROFESSION[lowerKeyword] || SKILLS_BY_PROFESSION['копирайтер']
  return [...professionSkills, ...COMMON_SKILLS]
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateSalary(from: number, to: number): number {
  if (from > 0 && to > 0) {
    return Math.round(from + (to - from) * 0.35)
  }
  if (from > 0) return from
  if (to > 0) return Math.round(to * 0.7)
  return 0
}

function findSkillsInText(text: string, professionKeyword: string): string[] {
  if (!text) return []
  const lowerText = text.toLowerCase()
  const foundSkills: string[] = []
  const skillsList = getSkillsForProfession(professionKeyword)

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

async function fetchVacanciesFromSuperJob(keyword: string, townId?: number, page: number = 0) {
  const params = new URLSearchParams({
    keyword: keyword,
    count: '100',
    page: String(page),
    no_agreement: '1',
  })

  if (townId && townId > 0) {
    params.append('town', String(townId))
  }

  const url = `${SUPERJOB_CONFIG.BASE_URL}/vacancies/?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'X-Api-App-Id': SUPERJOB_CONFIG.SECRET_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`SuperJob API error: ${response.status}`)
  }

  return response.json()
}

async function getAllVacancies(keyword: string, professionKeyword: string, townId?: number) {
  const allVacancies: any[] = []
  let page = 0
  let hasMore = true

  while (hasMore && page < 10) { // максимум 10 страниц = 1000 вакансий
    try {
      const response = await fetchVacanciesFromSuperJob(keyword, townId, page)

      for (const vacancy of response.objects) {
        // Пропускаем вакансии без зарплаты
        if (vacancy.agreement) continue
        if (vacancy.payment_from === 0 && vacancy.payment_to === 0) continue

        const salary = calculateSalary(vacancy.payment_from, vacancy.payment_to)
        if (salary === 0) continue

        const fullText = `${vacancy.profession} ${vacancy.work || ''} ${vacancy.candidat || ''}`
        const skills = findSkillsInText(fullText, professionKeyword)

        allVacancies.push({
          id: vacancy.id,
          profession: vacancy.profession,
          salary,
          town: vacancy.town?.title || 'Не указан',
          skills,
        })
      }

      hasMore = response.more
      page++

      if (hasMore) {
        await delay(600) // Задержка между запросами
      }
    } catch (error) {
      console.error(`Error on page ${page}:`, error)
      break
    }
  }

  return allVacancies
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const profession = searchParams.get('profession') || 'копирайтер'
  const city = searchParams.get('city') || 'Москва'

  try {
    const townId = TOWNS[city] ?? 4
    const searchKeyword = PROFESSION_KEYWORDS[profession] || profession.toLowerCase()

    // Загружаем вакансии для выбранного города
    const vacancies = await getAllVacancies(searchKeyword, searchKeyword, townId)

    if (vacancies.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Вакансии не найдены',
        data: null,
      })
    }

    // Считаем медиану зарплат
    const salaries = vacancies.map((v: any) => v.salary)
    const medianSalary = calculateMedian(salaries)

    // Анализируем навыки
    const skillsList = getSkillsForProfession(searchKeyword)
    const skillStats: Record<string, { withSkill: number[], withoutSkill: number[] }> = {}

    for (const skill of skillsList) {
      skillStats[skill.name] = { withSkill: [], withoutSkill: [] }
    }

    for (const vacancy of vacancies) {
      for (const skill of skillsList) {
        if (vacancy.skills.includes(skill.name)) {
          skillStats[skill.name].withSkill.push(vacancy.salary)
        } else {
          skillStats[skill.name].withoutSkill.push(vacancy.salary)
        }
      }
    }

    // Формируем топ-10 навыков
    const skills = Object.entries(skillStats)
      .filter(([_, stats]) => stats.withSkill.length >= 2)
      .map(([name, stats]) => {
        const medianWith = calculateMedian(stats.withSkill)
        const medianWithout = calculateMedian(stats.withoutSkill)
        return {
          name,
          count: stats.withSkill.length,
          medianWithSkill: medianWith,
          salaryImpact: medianWith - medianWithout,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        profession,
        city,
        medianSalary,
        vacancyCount: vacancies.length,
        skills,
        updatedAt: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Ошибка при загрузке данных',
      data: null,
    }, { status: 500 })
  }
}
