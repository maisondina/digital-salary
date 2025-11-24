// HH.ru API Configuration
const HH_CONFIG = {
  CLIENT_ID: 'L3CLEES8LPH30SES0R0AMTJQ3NC7AIF97O1VTCG5UDE1K2AHF7TTS6F1IU8JFCFG',
  CLIENT_SECRET: 'H5K7T7P2G8CBCA9D4U072VAV1MA3LMJ91DF2VAAQIEHCQL94VI37NQA78FRMMIAF',
  BASE_URL: 'https://api.hh.ru',
} as const

// Types for HH.ru API responses
export interface HHSalary {
  from: number | null
  to: number | null
  currency: string
  gross: boolean
}

export interface HHKeySkill {
  name: string
}

export interface HHVacancy {
  id: string
  name: string
  salary: HHSalary | null
  key_skills: HHKeySkill[]
  area: {
    id: string
    name: string
  }
}

export interface HHVacanciesResponse {
  items: HHVacancy[]
  found: number
  pages: number
  page: number
  per_page: number
}

export interface ProcessedVacancy {
  name: string
  salary: number | null
  key_skills: string[]
}

export interface SkillAnalysis {
  name: string
  count: number
  median_salary: number
  salary_impact: number
}

export interface RegionalSalaries {
  moscow: number | null
  spb: number | null
  russia: number | null
}

// Area codes for regions
export const AREAS = {
  MOSCOW: '1',
  SPB: '2',
  RUSSIA: '113',
} as const

/**
 * Calculates median value from an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

/**
 * Converts salary to RUB if needed and normalizes it
 */
function normalizeSalary(salary: HHSalary | null): number | null {
  if (!salary) return null

  // Only work with RUB currency
  if (salary.currency !== 'RUR' && salary.currency !== 'RUB') return null

  let amount: number | null = null

  // If both from and to are specified, take average
  if (salary.from && salary.to) {
    amount = (salary.from + salary.to) / 2
  } else if (salary.from) {
    amount = salary.from
  } else if (salary.to) {
    amount = salary.to
  }

  if (!amount) return null

  // Convert to net salary if gross (approximately)
  if (salary.gross) {
    amount = amount * 0.87 // After 13% tax
  }

  return Math.round(amount)
}

/**
 * Fetches vacancies from HH.ru API
 * @param profession - Search query for profession
 * @param area - Area code (optional, e.g., '1' for Moscow)
 * @returns Array of processed vacancies
 */
export async function fetchVacancies(
  profession: string,
  area?: string
): Promise<ProcessedVacancy[]> {
  try {
    const params = new URLSearchParams({
      text: profession,
      per_page: '100',
      only_with_salary: 'true',
    })

    if (area) {
      params.append('area', area)
    }

    const url = `${HH_CONFIG.BASE_URL}/vacancies?${params}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Digital Salary Calculator (contact@example.com)',
      },
    })

    if (!response.ok) {
      throw new Error(`HH.ru API error: ${response.status} ${response.statusText}`)
    }

    const data: HHVacanciesResponse = await response.json()

    // Process vacancies
    const processed: ProcessedVacancy[] = data.items.map(vacancy => ({
      name: vacancy.name,
      salary: normalizeSalary(vacancy.salary),
      key_skills: vacancy.key_skills.map(skill => skill.name),
    }))

    return processed
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch vacancies: ${error.message}`)
    }
    throw new Error('Failed to fetch vacancies: Unknown error')
  }
}

/**
 * Analyzes skills from vacancies and calculates their impact on salary
 * @param vacancies - Array of processed vacancies
 * @returns Array of top 10 skills with their analysis
 */
export function analyzeSkills(vacancies: ProcessedVacancy[]): SkillAnalysis[] {
  // Count skills and collect salaries for each skill
  const skillsMap = new Map<string, {
    count: number
    salaries: number[]
  }>()

  // Collect all valid salaries for baseline
  const allSalaries: number[] = []

  vacancies.forEach(vacancy => {
    if (vacancy.salary) {
      allSalaries.push(vacancy.salary)

      vacancy.key_skills.forEach(skill => {
        const existing = skillsMap.get(skill) || { count: 0, salaries: [] }
        existing.count++
        existing.salaries.push(vacancy.salary!)
        skillsMap.set(skill, existing)
      })
    }
  })

  if (allSalaries.length === 0) {
    return []
  }

  const baselineMedian = calculateMedian(allSalaries)

  // Calculate median salary for each skill
  const skillsAnalysis: SkillAnalysis[] = Array.from(skillsMap.entries())
    .map(([name, data]) => {
      const median = calculateMedian(data.salaries)
      return {
        name,
        count: data.count,
        median_salary: median,
        salary_impact: Math.round(median - baselineMedian),
      }
    })
    .sort((a, b) => b.count - a.count) // Sort by popularity
    .slice(0, 10) // Take top 10

  return skillsAnalysis
}

/**
 * Calculates median salaries for different regions
 * @param profession - Search query for profession
 * @returns Object with median salaries for Moscow, SPB, and all Russia
 */
export async function calculateRegionalSalaries(
  profession: string
): Promise<RegionalSalaries> {
  try {
    // Fetch vacancies for all regions in parallel
    const [moscowVacancies, spbVacancies, russiaVacancies] = await Promise.all([
      fetchVacancies(profession, AREAS.MOSCOW),
      fetchVacancies(profession, AREAS.SPB),
      fetchVacancies(profession, AREAS.RUSSIA),
    ])

    // Calculate medians
    const moscowSalaries = moscowVacancies
      .map(v => v.salary)
      .filter((s): s is number => s !== null)

    const spbSalaries = spbVacancies
      .map(v => v.salary)
      .filter((s): s is number => s !== null)

    const russiaSalaries = russiaVacancies
      .map(v => v.salary)
      .filter((s): s is number => s !== null)

    return {
      moscow: moscowSalaries.length > 0 ? calculateMedian(moscowSalaries) : null,
      spb: spbSalaries.length > 0 ? calculateMedian(spbSalaries) : null,
      russia: russiaSalaries.length > 0 ? calculateMedian(russiaSalaries) : null,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to calculate regional salaries: ${error.message}`)
    }
    throw new Error('Failed to calculate regional salaries: Unknown error')
  }
}

/**
 * Fetches and analyzes complete data for a profession
 * @param profession - Search query for profession
 * @returns Object with skills analysis and regional salaries
 */
export async function analyzeProfession(profession: string) {
  try {
    // Fetch all Russia vacancies for skills analysis
    const vacancies = await fetchVacancies(profession, AREAS.RUSSIA)

    // Analyze skills
    const skills = analyzeSkills(vacancies)

    // Get regional salaries
    const regionalSalaries = await calculateRegionalSalaries(profession)

    return {
      skills,
      regional_salaries: regionalSalaries,
      total_vacancies: vacancies.length,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to analyze profession: ${error.message}`)
    }
    throw new Error('Failed to analyze profession: Unknown error')
  }
}
