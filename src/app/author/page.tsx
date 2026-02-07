import Link from 'next/link'

export default function AuthorPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Навигация */}
        <nav className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-blue-500 hover:underline text-sm">&larr; Калькулятор</Link>
          <Link href="/about" className="text-blue-500 hover:underline text-sm">О проекте</Link>
        </nav>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Кто это создал</h1>

          <p className="text-gray-700 mb-4">
            Привет! Я <strong>Дина Майсон</strong> — UX-редактор и автор телеграм-канала{' '}
            <a
              href="https://t.me/+ZY7Np9Z9M95kMmY6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              &laquo;Текст готов&raquo;
            </a>.
          </p>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Зачем я сделала этот проект?</h2>
          <p className="text-gray-700 mb-4">
            Работая фрилансером, я постоянно сталкивалась с вопросом: <strong>&laquo;Сколько я могу
            просить за свои навыки?&raquo;</strong>
          </p>
          <p className="text-gray-700 mb-4">
            Хотелось инструмент, который покажет честную рыночную оценку, объяснит, какие навыки
            реально ценятся, и поможет понять, куда расти дальше.
          </p>
          <p className="text-gray-700 mb-4">
            Существующие калькуляторы зарплат либо слишком общие, либо основаны на опросах
            (где люди часто завышают цифры). Я решила сделать инструмент на реальных данных
            с SuperJob.
          </p>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Как это получилось?</h2>
          <p className="text-gray-700 mb-4">
            Digital Salary полностью создан в диалоге с <strong>Claude</strong> — я формулировала
            идеи и требования, а Claude писал код, предлагал решения и помогал разбираться с
            техническими деталями.
          </p>
          <p className="text-gray-700 mb-4">
            Весь процесс занял около недели активной работы. Я не умею программировать, но
            благодаря Claude смогла создать рабочий продукт, который собирает данные через API,
            считает статистику и работает как полноценный веб-сервис.
          </p>

          <hr className="my-8 border-gray-100" />

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Связь</h2>
          <p className="text-gray-700 mb-2">
            По любым вопросам, предложениям или найденным багам пишите в Telegram:{' '}
            <a
              href="https://t.me/maisondina"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              @maisondina
            </a>
          </p>
          <p className="text-gray-700">
            Или заходите в канал{' '}
            <a
              href="https://t.me/+ZY7Np9Z9M95kMmY6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              &laquo;Текст готов&raquo;
            </a>
            , где я пишу про текст, редактуру и работу с контентом.
          </p>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-400">
          <p>Данные: SuperJob API</p>
        </footer>
      </div>
    </div>
  )
}
