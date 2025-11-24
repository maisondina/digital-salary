import * as fs from 'fs'
import * as path from 'path'
import { analyzeProfession } from '../lib/hhru'

interface CopywriterData {
  profession: string
  base_salary: number
  description: string
  regions: {
    moscow: { name: string; coefficient: number }
    spb: { name: string; coefficient: number }
    russia: { name: string; coefficient: number }
  }
  skills: Array<{
    id: string
    name: string
    icon: string
    levels: {
      basic: {
        name: string
        description: string
        salary_impact: number
      }
      confident: {
        name: string
        description: string
        salary_impact: number
      }
      expert: {
        name: string
        description: string
        salary_impact: number
      }
    }
  }>
  api_data?: {
    updated_at: string
    total_vacancies: number
    regional_salaries: {
      moscow: number | null
      spb: number | null
      russia: number | null
    }
    top_skills: Array<{
      name: string
      count: number
      median_salary: number
      salary_impact: number
    }>
  }
}

async function updateCopywriterData() {
  try {
    console.log('🚀 Начинаю сбор данных о копирайтерах с HH.ru...\n')

    // Собираем данные с API
    const professionData = await analyzeProfession('копирайтер')

    console.log(`✅ Собрано вакансий: ${professionData.total_vacancies}`)
    console.log(`✅ Найдено навыков: ${professionData.skills.length}\n`)

    // Выводим региональные зарплаты
    console.log('💰 Медианные зарплаты по регионам:')
    console.log(`   Москва: ${professionData.regional_salaries.moscow?.toLocaleString('ru-RU') || 'Нет данных'} ₽`)
    console.log(`   Санкт-Петербург: ${professionData.regional_salaries.spb?.toLocaleString('ru-RU') || 'Нет данных'} ₽`)
    console.log(`   Вся Россия: ${professionData.regional_salaries.russia?.toLocaleString('ru-RU') || 'Нет данных'} ₽\n`)

    // Выводим топ-10 навыков
    console.log('🎯 Топ-10 самых популярных навыков:\n')
    professionData.skills.forEach((skill, index) => {
      const impactSign = skill.salary_impact >= 0 ? '+' : ''
      console.log(
        `${index + 1}. ${skill.name}`,
        `(${skill.count} упоминаний, влияние: ${impactSign}${skill.salary_impact.toLocaleString('ru-RU')} ₽)`
      )
    })

    // Читаем существующий файл
    const dataPath = path.join(__dirname, '../data/copywriter.json')
    let existingData: CopywriterData

    try {
      const fileContent = fs.readFileSync(dataPath, 'utf-8')
      existingData = JSON.parse(fileContent)
    } catch (error) {
      console.log('\n⚠️  Файл copywriter.json не найден, создаю новый...')
      existingData = {
        profession: 'Копирайтер',
        base_salary: 55000,
        description: 'Медианная зарплата копирайтера в России',
        regions: {
          moscow: { name: 'Москва', coefficient: 1.15 },
          spb: { name: 'Санкт-Петербург', coefficient: 0.85 },
          russia: { name: 'Вся Россия', coefficient: 1.0 },
        },
        skills: [],
      }
    }

    // Обновляем данные
    const baseSalary = professionData.regional_salaries.russia || existingData.base_salary

    // Рассчитываем региональные коэффициенты
    const moscowCoef = professionData.regional_salaries.moscow && baseSalary
      ? professionData.regional_salaries.moscow / baseSalary
      : existingData.regions.moscow.coefficient

    const spbCoef = professionData.regional_salaries.spb && baseSalary
      ? professionData.regional_salaries.spb / baseSalary
      : existingData.regions.spb.coefficient

    const updatedData: CopywriterData = {
      ...existingData,
      base_salary: Math.round(baseSalary),
      regions: {
        moscow: {
          name: 'Москва',
          coefficient: Math.round(moscowCoef * 100) / 100,
        },
        spb: {
          name: 'Санкт-Петербург',
          coefficient: Math.round(spbCoef * 100) / 100,
        },
        russia: {
          name: 'Вся Россия',
          coefficient: 1.0,
        },
      },
      api_data: {
        updated_at: new Date().toISOString(),
        total_vacancies: professionData.total_vacancies,
        regional_salaries: professionData.regional_salaries,
        top_skills: professionData.skills,
      },
    }

    // Сохраняем в файл
    fs.writeFileSync(dataPath, JSON.stringify(updatedData, null, 2), 'utf-8')

    console.log('\n✅ Данные успешно обновлены и сохранены в src/data/copywriter.json')
    console.log(`\n📊 Обновленная базовая зарплата: ${updatedData.base_salary.toLocaleString('ru-RU')} ₽`)
    console.log('📊 Обновленные региональные коэффициенты:')
    console.log(`   Москва: ${updatedData.regions.moscow.coefficient}`)
    console.log(`   Санкт-Петербург: ${updatedData.regions.spb.coefficient}`)
    console.log(`   Вся Россия: ${updatedData.regions.russia.coefficient}`)
  } catch (error) {
    console.error('❌ Ошибка при обновлении данных:', error)
    process.exit(1)
  }
}

// Запускаем скрипт
updateCopywriterData()
