// API Constants
export const HH_API_CONFIG = {
  CLIENT_ID: 'L3CLEES8LPH30SES0R0AMTJQ3NC7AIF97O1VTCG5UDE1K2AHF7TTS6F1IU8JFCFG',
  CLIENT_SECRET: 'H5K7T7P2G8CBCA9D4U072VAV1MA3LMJ91DF2VAAQIEHCQL94VI37NQA78FRMMIAF',
  BASE_URL: 'https://api.hh.ru'
} as const

// Types
export interface HHSalary {
  from: number | null
  to: number | null
  currency: string | null
  gross: boolean | null
}

export interface HHKeySkill {
  name: string
}

export interface HHVacancy {
  id: string
  name: string
  salary: HHSalary | null
  key_skills: HHKeySkill[]
}

export interface HHApiResponse {
  items: HHVacancy[]
  found: number
  pages: number
  per_page: number
}

export interface VacancyData {
  name: string
  salary: HHSalary | null
  key_skills: HHKeySkill[]
}

export interface SkillAnalysis {
  name: string
  count: number
  medianSalary: number | null
  salaryImpact: number
}

export interface RegionalSalaryData {
  moscow: number | null
  spb: number | null
  russia: number | null
}

// Helper function to calculate median
function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

// Helper function to extract salary value
function extractSalaryValue(salary: HHSalary | null): number | null {
  if (!salary) return null

  // If both from and to are present, use average
  if (salary.from && salary.to) {
    return (salary.from + salary.to) / 2
  }

  // Otherwise use whichever is available
  return salary.from || salary.to
}

/**
 * Fetches vacancies from hh.ru API by profession and optional area
 * @param profession - Job title or profession to search for
 * @param area - Optional area code (1=Moscow, 2=SPb, 113=All Russia)
 * @returns Array of vacancy data with name, salary, and key skills
 */
export async function fetchVacancies(
  profession: string,
  area?: string
): Promise<VacancyData[]> {
  try {
    const params = new URLSearchParams({
      text: profession,
      per_page: '100'
    })

    if (area) {
      params.append('area', area)
    }

    const url = `${HH_API_CONFIG.BASE_URL}/vacancies?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DigitalSalary/2.0 (digital-salary-app)'
      }
    })

    if (!response.ok) {
      throw new Error(`HH API error: ${response.status} ${response.statusText}`)
    }

    const data: HHApiResponse = await response.json()

    // Map to simplified format
    return data.items.map(item => ({
      name: item.name,
      salary: item.salary,
      key_skills: item.key_skills
    }))
  } catch (error) {
    console.error('Error fetching vacancies:', error)
    throw new Error(
      `Failed to fetch vacancies: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Analyzes skills from vacancies to find top 10 most popular skills
 * and calculates median salary for each skill
 * @param vacancies - Array of vacancy data
 * @returns Array of top 10 skills with their statistics
 */
export async function analyzeSkills(
  vacancies: VacancyData[]
): Promise<SkillAnalysis[]> {
  try {
    // Count skill occurrences and collect salaries
    const skillMap = new Map<string, { count: number; salaries: number[] }>()

    vacancies.forEach(vacancy => {
      const salaryValue = extractSalaryValue(vacancy.salary)

      vacancy.key_skills.forEach(skill => {
        const existing = skillMap.get(skill.name)

        if (existing) {
          existing.count++
          if (salaryValue) {
            existing.salaries.push(salaryValue)
          }
        } else {
          skillMap.set(skill.name, {
            count: 1,
            salaries: salaryValue ? [salaryValue] : []
          })
        }
      })
    })

    // Calculate overall median salary for baseline
    const allSalaries = vacancies
      .map(v => extractSalaryValue(v.salary))
      .filter((s): s is number => s !== null)
    const overallMedian = calculateMedian(allSalaries) || 0

    // Convert to array and sort by count
    const skillsArray: SkillAnalysis[] = Array.from(skillMap.entries())
      .map(([name, data]) => {
        const medianSalary = calculateMedian(data.salaries)
        const salaryImpact = medianSalary ? medianSalary - overallMedian : 0

        return {
          name,
          count: data.count,
          medianSalary,
          salaryImpact
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return skillsArray
  } catch (error) {
    console.error('Error analyzing skills:', error)
    throw new Error(
      `Failed to analyze skills: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Calculates regional median salaries for Moscow, SPb, and all Russia
 * @param profession - Job title or profession to search for
 * @returns Object with median salaries by region
 */
export async function calculateRegionalSalaries(
  profession: string
): Promise<RegionalSalaryData> {
  try {
    // Fetch vacancies for each region in parallel
    const [moscowVacancies, spbVacancies, russiaVacancies] = await Promise.all([
      fetchVacancies(profession, '1'),   // Moscow
      fetchVacancies(profession, '2'),   // SPb
      fetchVacancies(profession, '113')  // All Russia
    ])

    // Calculate median for each region
    const calculateRegionMedian = (vacancies: VacancyData[]): number | null => {
      const salaries = vacancies
        .map(v => extractSalaryValue(v.salary))
        .filter((s): s is number => s !== null)
      return calculateMedian(salaries)
    }

    return {
      moscow: calculateRegionMedian(moscowVacancies),
      spb: calculateRegionMedian(spbVacancies),
      russia: calculateRegionMedian(russiaVacancies)
    }
  } catch (error) {
    console.error('Error calculating regional salaries:', error)
    throw new Error(
      `Failed to calculate regional salaries: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
