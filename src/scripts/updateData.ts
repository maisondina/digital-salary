import * as fs from 'fs'
import * as path from 'path'
import { analyzeProfession, ProfessionAnalysis, SkillAnalysis } from '../lib/hhru'

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

interface CopywriterData {
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
// ИКОНКИ
// ============================================

const SKILL_ICONS: Record<string, string> = {
  'seo': '🔎',
  'smm': '📱',
  'email': '📧',
  'контент': '📈',
  'ux': '✨',
  'лендинг': '🎯',
  'сторителлинг': '📖',
  'редакт': '✏️',
  'техническ': '📋',
  'нейминг': '💡',
  'figma': '🎨',
  'tilda': '🌐',
  'wordpress': '🌐',
  'английск': '🇬🇧',
  'аналитик': '📊',
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

// Описания для навыков
const SKILL_DESCRIPTIONS: Record<string, { basic: string; confident: string; expert: string }> = {
  'SEO': {
    basic: 'Знаю основы SEO, понимаю что такое ключевые слова',
    confident: 'Пишу SEO-оптимизированные тексты, работаю с семантикой',
    expert: 'Выстраиваю SEO-стратегию контента, анализирую конкурентов',
  },
  'SMM': {
    basic: 'Понимаю специфику текстов для соцсетей',
    confident: 'Веду контент для соцсетей, понимаю форматы площадок',
    expert: 'Разрабатываю SMM-стратегии, создаю вирусный контент',
  },
  'Email-маркетинг': {
    basic: 'Пишу простые письма и рассылки',
    confident: 'Создаю цепочки писем, понимаю воронки',
    expert: 'Выстраиваю email-стратегии, работаю с сегментацией',
  },
  'UX-writing': {
    basic: 'Понимаю принципы UX-текстов',
    confident: 'Пишу интерфейсные тексты, работаю с микрокопи',
    expert: 'Проектирую UX-тексты в связке с дизайном и продуктом',
  },
  'Лендинги': {
    basic: 'Понимаю структуру продающего лендинга',
    confident: 'Пишу конверсионные тексты для лендингов',
    expert: 'Создаю высококонверсионные лендинги с A/B-тестами',
  },
  'Редактура': {
    basic: 'Вычитываю и исправляю ошибки',
    confident: 'Редактирую тексты, улучшаю структуру и стиль',
    expert: 'Выстраиваю редакционные процессы и стандарты',
  },
  'Figma': {
    basic: 'Могу посмотреть макеты в Figma',
    confident: 'Работаю с текстами прямо в Figma',
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
  const impact = Math.max(skill.salary_impact, 0) // Не показываем отрицательное влияние
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

function convertToDataFormat(analysis: ProfessionAnalysis): CopywriterData {
  const baseSalary = analysis.base_salary

  const regions = {
    moscow: {
      name: 'Москва',
      median_salary: analysis.regional_salaries.moscow?.median_salary || Math.round(baseSalary * 1.3),
      vacancy_count: analysis.regional_salaries.moscow?.vacancy_count || 0,
    },
    spb: {
      name: 'Санкт-Петербург',
      median_salary: analysis.regional_salaries.spb?.median_salary || Math.round(baseSalary * 1.1),
      vacancy_count: analysis.regional_salaries.spb?.vacancy_count || 0,
    },
    russia: {
      name: 'Вся Россия',
      median_salary: baseSalary,
      vacancy_count: analysis.regional_salaries.russia?.vacancy_count || 0,
    },
  }

  // Фильтруем навыки с положительным влиянием
  const positiveSkills = analysis.skills.filter(s => s.salary_impact > 0)
  
  const skills: SkillConfig[] = positiveSkills.map(skill => ({
    id: generateSkillId(skill.name),
    name: skill.name,
    icon: getSkillIcon(skill.name),
    levels: generateSkillLevels(skill),
  }))

  return {
    profession: 'Копирайтер',
    base_salary: baseSalary,
    description: `Медианная зарплата копирайтера в России на основе ${analysis.total_vacancies} актуальных вакансий`,
    regions,
    skills,
    meta: {
      updated_at: analysis.updated_at,
      total_vacancies: analysis.total_vacancies,
      data_source: 'hh.ru API',
    },
  }
}

// ============================================
// MAIN
// ============================================

async function updateCopywriterData() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     DIGITAL SALARY — ОБНОВЛЕНИЕ ДАННЫХ                     ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')

  try {
    const analysis = await analyzeProfession('копирайтер')
    const data = convertToDataFormat(analysis)

    const dataPath = path.join(__dirname, '../data/copywriter.json')
    const dataDir = path.dirname(dataPath)
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')

    console.log('\n')
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║     ✅ ДАННЫЕ УСПЕШНО ОБНОВЛЕНЫ                            ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('\n')
    
    console.log(`📁 Файл: ${dataPath}`)
    console.log(`💰 Базовая зарплата: ${data.base_salary.toLocaleString('ru-RU')} ₽`)
    console.log(`🎯 Навыков с положительным влиянием: ${data.skills.length}`)
    console.log(`📅 Обновлено: ${new Date(data.meta.updated_at).toLocaleString('ru-RU')}`)
    
    console.log('\n💰 Региональные медианы:')
    console.log(`   • Москва: ${data.regions.moscow.median_salary.toLocaleString('ru-RU')} ₽`)
    console.log(`   • СПб: ${data.regions.spb.median_salary.toLocaleString('ru-RU')} ₽`)
    console.log(`   • Россия: ${data.regions.russia.median_salary.toLocaleString('ru-RU')} ₽`)
    
    if (data.skills.length > 0) {
      console.log('\n🎯 Навыки, повышающие зарплату:')
      data.skills.forEach((skill, i) => {
        const impact = skill.levels.expert.salary_impact
        console.log(`   ${i + 1}. ${skill.icon} ${skill.name} → +${impact.toLocaleString('ru-RU')} ₽`)
      })
    }
    
    console.log('\n')

  } catch (error) {
    console.error('\n❌ ОШИБКА:', error)
    process.exit(1)
  }
}

updateCopywriterData()
