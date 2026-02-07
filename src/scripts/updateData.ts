import * as fs from 'fs'
import * as path from 'path'
import {
  analyzeProfession,
  analyzeSkills,
  fetchAllVacancies,
  getRegionalSalaries,
  ProcessedVacancy,
  SkillAnalysis,
  RegionalSalaries,
} from '../lib/superjob-api'

// ============================================
// ТИПЫ
// ============================================

interface SkillLevel {
  name: string
  description: string
  salary_impact: number
}

interface SkillConfig {
  id: string
  name: string
  icon: string
  levels: {
    basic: SkillLevel
    confident: SkillLevel
    expert: SkillLevel
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
  description: string
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

// ============================================
// КОНФИГУРАЦИЯ ПРОФЕССИЙ
// ============================================

interface ProfessionConfig {
  name: string
  keyword: string
  filename: string
  description: (count: number) => string
}

const PROFESSIONS: ProfessionConfig[] = [
  {
    name: 'Копирайтер',
    keyword: 'копирайтер',
    filename: 'copywriter.json',
    description: (count) => `Медианная зарплата копирайтера в России на основе ${count} актуальных вакансий`,
  },
  {
    name: 'SMM-специалист',
    keyword: 'SMM менеджер',
    filename: 'smm.json',
    description: (count) => `Медианная зарплата SMM-специалиста в России на основе ${count} актуальных вакансий`,
  },
  {
    name: 'Таргетолог',
    keyword: 'таргетолог',
    filename: 'targetolog.json',
    description: (count) => `Медианная зарплата таргетолога в России на основе ${count} актуальных вакансий`,
  },
  {
    name: 'SEO-специалист',
    keyword: 'SEO специалист',
    filename: 'seo.json',
    description: (count) => `Медианная зарплата SEO-специалиста в России на основе ${count} актуальных вакансий`,
  },
]

// ============================================
// ИКОНКИ
// ============================================

const SKILL_ICONS: Record<string, string> = {
  'seo': '🔎',
  'smm': '📱',
  'email': '📧',
  'контент': '📈',
  'ux': '✨',
  'лендинг': '🎯',
  'редакт': '✏️',
  'техническ': '📋',
  'креатив': '💡',
  'figma': '🎨',
  'tilda': '🌐',
  'конструктор': '🌐',
  'английск': '🇬🇧',
  'аналитик': '📊',
  'b2b': '🏢',
  'ии': '🤖',
  'таргет': '🎯',
  'контекстн': '📢',
  'яндекс': '🔍',
  'google': '🔍',
  'метрик': '📊',
  'линкбилд': '🔗',
  'семантик': '🗂️',
  'видео': '🎬',
  'reels': '🎬',
  'stories': '📸',
  'influence': '🤝',
  'блогер': '🤝',
}

function getSkillIcon(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, icon] of Object.entries(SKILL_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return '💼'
}

function generateSkillId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ============================================
// ОПИСАНИЯ НАВЫКОВ
// ============================================

const SKILL_DESCRIPTIONS: Record<string, { basic: string; confident: string; expert: string }> = {
  'SEO-копирайтинг': {
    basic: 'Знаю основы SEO, понимаю что такое ключевые слова',
    confident: 'Пишу SEO-оптимизированные тексты, работаю с семантикой',
    expert: 'Выстраиваю SEO-стратегию контента, анализирую конкурентов',
  },
  'SMM и соцсети': {
    basic: 'Понимаю специфику текстов для соцсетей',
    confident: 'Веду контент для соцсетей, понимаю форматы площадок',
    expert: 'Разрабатываю SMM-стратегии, создаю вирусный контент',
  },
  'Email-маркетинг': {
    basic: 'Пишу простые письма и рассылки',
    confident: 'Создаю цепочки писем, понимаю воронки',
    expert: 'Выстраиваю email-стратегии, работаю с сегментацией',
  },
  'UX-редактура': {
    basic: 'Понимаю принципы UX-текстов',
    confident: 'Пишу интерфейсные тексты, работаю с микрокопи',
    expert: 'Проектирую UX-тексты в связке с дизайном и продуктом',
  },
  'Создание лендингов': {
    basic: 'Понимаю структуру продающего лендинга',
    confident: 'Пишу конверсионные тексты для лендингов',
    expert: 'Создаю высококонверсионные лендинги с A/B-тестами',
  },
  'Редактура и корректура': {
    basic: 'Вычитываю и исправляю ошибки',
    confident: 'Редактирую тексты, улучшаю структуру и стиль',
    expert: 'Выстраиваю редакционные процессы и стандарты',
  },
  'Работа с графикой': {
    basic: 'Могу посмотреть макеты в Figma',
    confident: 'Работаю с текстами прямо в Figma, создаю простую графику',
    expert: 'Создаю прототипы и работаю в связке с дизайнерами',
  },
  'Английский язык': {
    basic: 'Читаю и понимаю английские тексты',
    confident: 'Пишу тексты на английском языке',
    expert: 'Создаю нативный контент для англоязычной аудитории',
  },
  'Аналитика': {
    basic: 'Понимаю базовые метрики',
    confident: 'Анализирую эффективность контента',
    expert: 'Принимаю решения на основе данных, строю отчёты',
  },
  'Техническое писательство': {
    basic: 'Могу написать простую инструкцию или FAQ',
    confident: 'Пишу документацию к продуктам и API',
    expert: 'Выстраиваю системы документации с нуля',
  },
  'Креативный копирайтинг': {
    basic: 'Умею писать заголовки и слоганы',
    confident: 'Создаю концепции рекламных кампаний',
    expert: 'Разрабатываю креативные стратегии для брендов',
  },
  'B2B-копирайтинг': {
    basic: 'Понимаю специфику B2B-текстов',
    confident: 'Пишу коммерческие предложения и презентации',
    expert: 'Выстраиваю контент-стратегию для B2B-продаж',
  },
  'Контент-стратегия': {
    basic: 'Составляю контент-планы',
    confident: 'Разрабатываю контент-стратегии для каналов',
    expert: 'Управляю редакцией и контент-маркетингом',
  },
  'Работа с ИИ': {
    basic: 'Использую ChatGPT для рутинных задач',
    confident: 'Пишу промпты, автоматизирую часть работы с ИИ',
    expert: 'Интегрирую ИИ-инструменты в рабочие процессы',
  },
  'Работа с конструкторами сайтов': {
    basic: 'Могу отредактировать текст на готовой странице',
    confident: 'Самостоятельно собираю лендинги и простые сайты',
    expert: 'Создаю сложные сайты с анимациями и интеграциями',
  },
  'Таргетированная реклама': {
    basic: 'Понимаю основы таргетинга в соцсетях',
    confident: 'Настраиваю и веду рекламные кампании в VK и TG',
    expert: 'Оптимизирую воронки, управляю бюджетами, масштабирую кампании',
  },
  'Контекстная реклама': {
    basic: 'Понимаю принципы контекстной рекламы',
    confident: 'Настраиваю кампании в Яндекс.Директ',
    expert: 'Управляю крупными аккаунтами, оптимизирую ROI',
  },
  'Видео и Reels': {
    basic: 'Снимаю простые сторис и рилсы',
    confident: 'Создаю вовлекающий видеоконтент для соцсетей',
    expert: 'Выстраиваю видео-стратегию, управляю продакшеном',
  },
  'Работа с блогерами': {
    basic: 'Нахожу и связываюсь с блогерами',
    confident: 'Веду интеграции, контролирую размещения',
    expert: 'Выстраиваю стратегию инфлюенс-маркетинга',
  },
  'Яндекс.Метрика и аналитика': {
    basic: 'Понимаю базовые отчёты в Метрике',
    confident: 'Настраиваю цели, сегменты и отчёты',
    expert: 'Принимаю решения на основе данных, строю дашборды',
  },
  'Google Analytics': {
    basic: 'Понимаю базовые отчёты в GA',
    confident: 'Настраиваю цели, отслеживаю конверсии',
    expert: 'Строю сложные отчёты, интегрирую с рекламными системами',
  },
  'Семантическое ядро': {
    basic: 'Знаю что такое семантическое ядро',
    confident: 'Собираю и кластеризую семантику',
    expert: 'Выстраиваю SEO-стратегию на основе семантики',
  },
  'Линкбилдинг': {
    basic: 'Понимаю роль ссылок в SEO',
    confident: 'Веду работу по наращиванию ссылочной массы',
    expert: 'Разрабатываю стратегию линкбилдинга',
  },
}

function getSkillDescriptions(skillName: string): { basic: string; confident: string; expert: string } {
  if (SKILL_DESCRIPTIONS[skillName]) {
    return SKILL_DESCRIPTIONS[skillName]
  }
  return {
    basic: `Знаю основы ${skillName.toLowerCase()}`,
    confident: `Уверенно работаю с ${skillName.toLowerCase()}`,
    expert: `Эксперт в ${skillName.toLowerCase()}`,
  }
}

function generateSkillLevels(skill: SkillAnalysis): SkillConfig['levels'] {
  const impact = Math.max(skill.salaryImpact, 0)
  const descriptions = getSkillDescriptions(skill.name)

  return {
    basic: {
      name: 'Базовый',
      description: descriptions.basic,
      salary_impact: Math.round(impact * 0.3),
    },
    confident: {
      name: 'Уверенный',
      description: descriptions.confident,
      salary_impact: Math.round(impact * 0.6),
    },
    expert: {
      name: 'Экспертный',
      description: descriptions.expert,
      salary_impact: impact,
    },
  }
}

// ============================================
// КОНВЕРТАЦИЯ В ФОРМАТ ДАННЫХ
// ============================================

function convertToDataFormat(
  profConfig: ProfessionConfig,
  allVacancies: ProcessedVacancy[],
  skills: SkillAnalysis[],
  regionalSalaries: RegionalSalaries,
): ProfessionData {
  const calculateMedian = (numbers: number[]): number => {
    if (numbers.length === 0) return 0
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  }

  const baseSalary = regionalSalaries.russia?.medianSalary || calculateMedian(allVacancies.map(v => v.salary))

  const regions = {
    moscow: {
      name: 'Москва',
      median_salary: regionalSalaries.moscow?.medianSalary || Math.round(baseSalary * 1.3),
      vacancy_count: regionalSalaries.moscow?.vacancyCount || 0,
    },
    spb: {
      name: 'Санкт-Петербург',
      median_salary: regionalSalaries.spb?.medianSalary || Math.round(baseSalary * 1.1),
      vacancy_count: regionalSalaries.spb?.vacancyCount || 0,
    },
    russia: {
      name: 'Вся Россия',
      median_salary: baseSalary,
      vacancy_count: regionalSalaries.russia?.vacancyCount || allVacancies.length,
    },
  }

  // Фильтруем навыки с положительным влиянием
  const positiveSkills = skills.filter(s => s.salaryImpact > 0)

  const skillConfigs: SkillConfig[] = positiveSkills.map(skill => ({
    id: generateSkillId(skill.name),
    name: skill.name,
    icon: getSkillIcon(skill.name),
    levels: generateSkillLevels(skill),
  }))

  return {
    profession: profConfig.name,
    base_salary: baseSalary,
    description: profConfig.description(allVacancies.length),
    regions,
    skills: skillConfigs,
    meta: {
      updated_at: new Date().toISOString(),
      total_vacancies: allVacancies.length,
      data_source: 'SuperJob API',
    },
  }
}

// ============================================
// ОБНОВЛЕНИЕ ОДНОЙ ПРОФЕССИИ
// ============================================

async function updateProfession(profConfig: ProfessionConfig): Promise<void> {
  console.log('\n')
  console.log('┌' + '─'.repeat(58) + '┐')
  console.log(`│  📊 ${profConfig.name.padEnd(52)}│`)
  console.log('└' + '─'.repeat(58) + '┘')

  // 1. Загружаем все вакансии по России для анализа навыков
  console.log('\n📥 Загружаем вакансии по всей России...')
  const allVacancies = await fetchAllVacancies(profConfig.keyword)

  if (allVacancies.length === 0) {
    console.log(`⚠️  Не найдено вакансий для "${profConfig.keyword}". Пропускаем.`)
    return
  }

  // 2. Анализируем навыки
  console.log('\n🎯 Анализируем навыки...')
  const skills = analyzeSkills(allVacancies)

  console.log(`   Найдено навыков с данными: ${skills.length}`)
  skills.forEach((s, i) => {
    const sign = s.salaryImpact >= 0 ? '+' : ''
    console.log(`   ${i + 1}. ${s.name}: ${sign}${s.salaryImpact.toLocaleString('ru-RU')} ₽ (${s.count} вакансий)`)
  })

  // 3. Получаем региональные данные
  console.log('\n📍 Загружаем региональные данные...')
  const regionalSalaries = await getRegionalSalaries(profConfig.keyword)

  if (regionalSalaries.moscow) {
    console.log(`   Москва: ${regionalSalaries.moscow.medianSalary.toLocaleString('ru-RU')} ₽ (${regionalSalaries.moscow.vacancyCount} вакансий)`)
  }
  if (regionalSalaries.spb) {
    console.log(`   СПб: ${regionalSalaries.spb.medianSalary.toLocaleString('ru-RU')} ₽ (${regionalSalaries.spb.vacancyCount} вакансий)`)
  }
  if (regionalSalaries.russia) {
    console.log(`   Россия: ${regionalSalaries.russia.medianSalary.toLocaleString('ru-RU')} ₽ (${regionalSalaries.russia.vacancyCount} вакансий)`)
  }

  // 4. Конвертируем и сохраняем
  const data = convertToDataFormat(profConfig, allVacancies, skills, regionalSalaries)

  const dataPath = path.join(__dirname, '../data', profConfig.filename)
  const dataDir = path.dirname(dataPath)

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`\n✅ Сохранено: ${profConfig.filename}`)
  console.log(`   💰 Базовая зарплата: ${data.base_salary.toLocaleString('ru-RU')} ₽`)
  console.log(`   🎯 Навыков: ${data.skills.length}`)
  console.log(`   📊 Вакансий: ${data.meta.total_vacancies}`)
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     DIGITAL SALARY — ОБНОВЛЕНИЕ ДАННЫХ (SuperJob API)     ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  const startTime = Date.now()

  // Определяем какие профессии обновлять
  const targetProfession = process.argv[2]
  let profsToUpdate = PROFESSIONS

  if (targetProfession) {
    const found = PROFESSIONS.find(
      p => p.keyword.toLowerCase() === targetProfession.toLowerCase() ||
           p.name.toLowerCase() === targetProfession.toLowerCase() ||
           p.filename.replace('.json', '') === targetProfession.toLowerCase()
    )
    if (found) {
      profsToUpdate = [found]
      console.log(`\n🎯 Обновляем только: ${found.name}`)
    } else {
      console.log(`\n⚠️ Профессия "${targetProfession}" не найдена. Доступные:`)
      PROFESSIONS.forEach(p => console.log(`   - ${p.name} (${p.keyword})`))
      process.exit(1)
    }
  } else {
    console.log(`\n📋 Обновляем все профессии: ${PROFESSIONS.map(p => p.name).join(', ')}`)
  }

  let successCount = 0

  for (const prof of profsToUpdate) {
    try {
      await updateProfession(prof)
      successCount++
    } catch (error) {
      console.error(`\n❌ Ошибка при обновлении "${prof.name}":`, error)
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000)

  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log(`║     ✅ ГОТОВО: ${successCount}/${profsToUpdate.length} профессий обновлено (${elapsed} сек)`.padEnd(59) + '║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')
}

main().catch(error => {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error)
  process.exit(1)
})
