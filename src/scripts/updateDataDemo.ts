import * as fs from 'fs'
import * as path from 'path'

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

async function updateCopywriterDataDemo() {
  try {
    console.log('🚀 Создаю демонстрационные данные о копирайтерах...\n')

    // Демонстрационные данные (как будто получены с API)
    const professionData = {
      total_vacancies: 87,
      regional_salaries: {
        moscow: 75000,
        spb: 58000,
        russia: 62000,
      },
      skills: [
        { name: 'SEO-копирайтинг', count: 45, median_salary: 70000, salary_impact: 8000 },
        { name: 'Контент-маркетинг', count: 38, median_salary: 68000, salary_impact: 6000 },
        { name: 'SMM', count: 35, median_salary: 65000, salary_impact: 3000 },
        { name: 'Работа с CMS', count: 28, median_salary: 64000, salary_impact: 2000 },
        { name: 'HTML/CSS', count: 24, median_salary: 72000, salary_impact: 10000 },
        { name: 'Google Analytics', count: 22, median_salary: 71000, salary_impact: 9000 },
        { name: 'Яндекс.Метрика', count: 20, median_salary: 69000, salary_impact: 7000 },
        { name: 'WordPress', count: 18, median_salary: 66000, salary_impact: 4000 },
        { name: 'Английский язык', count: 16, median_salary: 78000, salary_impact: 16000 },
        { name: 'Редактура', count: 15, median_salary: 63000, salary_impact: 1000 },
      ],
    }

    console.log(`✅ Собрано вакансий: ${professionData.total_vacancies}`)
    console.log(`✅ Найдено навыков: ${professionData.skills.length}\n`)

    // Выводим региональные зарплаты
    console.log('💰 Медианные зарплаты по регионам:')
    console.log(`   Москва: ${professionData.regional_salaries.moscow?.toLocaleString('ru-RU')} ₽`)
    console.log(`   Санкт-Петербург: ${professionData.regional_salaries.spb?.toLocaleString('ru-RU')} ₽`)
    console.log(`   Вся Россия: ${professionData.regional_salaries.russia?.toLocaleString('ru-RU')} ₽\n`)

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
updateCopywriterDataDemo()
