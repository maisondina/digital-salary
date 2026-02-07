import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Навигация */}
        <nav className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-blue-500 hover:underline text-sm">&larr; Калькулятор</Link>
          <Link href="/author" className="text-blue-500 hover:underline text-sm">Автор</Link>
        </nav>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Digital Salary</h1>
          <p className="text-lg text-gray-500 mb-8">Калькулятор рыночной стоимости диджитал-специалистов</p>

          <p className="text-gray-700 mb-6">
            Узнайте, сколько вы можете зарабатывать с вашим набором навыков — на основе реальных данных с SuperJob.
          </p>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Как это работает</h2>
          <p className="text-gray-700 mb-4">
            Digital Salary анализирует тысячи актуальных вакансий с SuperJob и показывает,
            как различные навыки влияют на зарплату специалиста.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex gap-3">
              <span className="text-xl">1.</span>
              <div>
                <span className="font-medium text-gray-800">Собираем данные</span>
                <span className="text-gray-600"> — анализируем все актуальные вакансии по вашей специальности в России</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">2.</span>
              <div>
                <span className="font-medium text-gray-800">Определяем базу</span>
                <span className="text-gray-600"> — медианная зарплата по профессии становится отправной точкой</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">3.</span>
              <div>
                <span className="font-medium text-gray-800">Оцениваем навыки</span>
                <span className="text-gray-600"> — сравниваем зарплаты в вакансиях с конкретным навыком и без него</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">4.</span>
              <div>
                <span className="font-medium text-gray-800">Учитываем регион</span>
                <span className="text-gray-600"> — рассчитываем среднюю зарплату по городам на основе реальных предложений</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">5.</span>
              <div>
                <span className="font-medium text-gray-800">Показываем результат</span>
                <span className="text-gray-600"> — вы сразу видите свою рыночную стоимость</span>
              </div>
            </div>
          </div>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Откуда данные</h2>
          <p className="text-gray-700 mb-4">
            Все данные собираются через официальный API сервиса SuperJob — одной из крупнейших
            площадок по поиску работы в России. Мы анализируем зарплатные вилки в открытых вакансиях,
            требования к навыкам, географию предложений и уровни позиций.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Важно:</strong> мы показываем рыночную медиану, а не среднюю зарплату. Медиана
            точнее отражает реальность, потому что не искажается экстремально высокими или низкими значениями.
          </p>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Почему медиана, а не среднее?</h2>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-gray-700 mb-2">5 копирайтеров зарабатывают: 40k, 50k, 55k, 60k, 250k</p>
            <p className="text-gray-600">Среднее: <span className="text-red-500 font-medium">91k ₽</span> (нереалистично!)</p>
            <p className="text-gray-600">Медиана: <span className="text-green-500 font-medium">55k ₽</span> (именно столько получает типичный специалист)</p>
          </div>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ограничения метода</h2>
          <p className="text-gray-700 mb-4">
            Калькулятор показывает рыночную оценку, но ваша реальная зарплата может отличаться
            из-за опыта работы, размера компании, портфолио и репутации, soft skills и текущей
            ситуации на рынке. Используйте калькулятор как ориентир при поиске работы или
            переговорах о зарплате.
          </p>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Технологии</h2>
          <p className="text-gray-700 mb-4">
            Digital Salary создан с помощью <strong>Claude</strong> (Anthropic) — AI-ассистента,
            который помог разработать методологию расчётов, написать весь код на Next.js и TypeScript,
            спроектировать интерфейс и интегрировать API SuperJob.
          </p>
          <p className="text-gray-700">
            Проект полностью open source:{' '}
            <a
              href="https://github.com/maisondina/digital-salary"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              github.com/maisondina/digital-salary
            </a>
          </p>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Планы развития</h2>
          <p className="text-gray-700">
            Учитывать опыт работы, показывать динамику зарплат по месяцам,
            давать рекомендации вроде &laquo;Выучите эти навыки для роста на +30,000 ₽&raquo;.
          </p>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-400">
          <p>Данные: SuperJob API</p>
        </footer>
      </div>
    </div>
  )
}
