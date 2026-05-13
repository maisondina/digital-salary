import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

// Маппинг отображаемого имени профессии → имя JSON-файла в src/data/
const PROFESSION_FILES: Record<string, string> = {
  'Копирайтер': 'copywriter.json',
  'SMM-специалист': 'smm.json',
  'Таргетолог': 'targetolog.json',
  'SEO-специалист': 'seo.json',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const profession = searchParams.get('profession') || 'Копирайтер'

  const filename = PROFESSION_FILES[profession]

  if (!filename) {
    return NextResponse.json(
      { success: false, error: `Неизвестная профессия: ${profession}` },
      { status: 400 }
    )
  }

  const filePath = path.join(process.cwd(), 'src', 'data', filename)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      {
        success: false,
        error: 'no_data',
        message: 'По этой профессии данные ещё собираются. Скоро добавим.',
      },
      { status: 404 }
    )
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to read profession data:', error)
    return NextResponse.json(
      { success: false, error: 'read_error', message: 'Не удалось прочитать данные' },
      { status: 500 }
    )
  }
}
