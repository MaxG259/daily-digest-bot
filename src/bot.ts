import 'dotenv/config'
import http from 'http'
import cron from 'node-cron'
import TelegramBot from 'node-telegram-bot-api'
import { connectDB } from './db'
import {
  addMessage,
  clearMessages,
  getAllChatIds,
  getMessages,
} from './storage'
import { generateSummary } from './summary'

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: false })

async function start() {
  await connectDB()
  await bot.deleteWebHook()
  await bot.startPolling()
  console.log('🤖 Bot started')
}

start()

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text ?? ''

  if (text === '/start') {
    await bot.sendMessage(
      chatId,
      `👋 Привет! Я твой личный дневник мыслей.\n\nПросто пиши мне что угодно в течение дня — идеи, планы, мысли, заметки.\n\nКаждый день в *20:00* я пришлю тебе сводку всего что ты написал.\n\n*Команды:*\n/list — показать всё за сегодня\n/summary — получить сводку прямо сейчас`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  if (text === '/list') {
    const messages = await getMessages(chatId)
    if (messages.length === 0) {
      await bot.sendMessage(chatId, '📭 Сегодня записей ещё нет')
    } else {
      const list = messages
        .map(
          (m, i) =>
            `${i + 1}. [${new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })}] ${m.text}`
        )
        .join('\n')
      await bot.sendMessage(chatId, `📝 *Твои мысли за сегодня:*\n\n${list}`, {
        parse_mode: 'Markdown',
      })
    }
    return
  }

  if (text === '/summary') {
    await bot.sendMessage(chatId, '⏳ Формирую сводку...')
    try {
      const messages = await getMessages(chatId)
      if (messages.length === 0) {
        await bot.sendMessage(chatId, '📭 Сегодня ты ничего не записывал')
        return
      }
      const date = new Date().toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Moscow',
      })
      const list = messages
        .map(
          (m, i) =>
            `${i + 1}. [${new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })}] ${m.text}`
        )
        .join('\n')
      const summary = await generateSummary(chatId)
      await bot.sendMessage(
        chatId,
        `📋 *Сводка за ${date}*\n\n📝 *Заметки:*\n${list}\n\n🤖 *Анализ:*\n${summary}`,
        {
          parse_mode: 'Markdown',
        }
      )
    } catch (err) {
      await bot.sendMessage(
        chatId,
        '❌ Ошибка при создании сводки. Попробуй позже.'
      )
    }
    return
  }

  // Обычное сообщение — сохраняем
  await addMessage(chatId, text)
  await bot.sendMessage(chatId, '✅ Записал')
})

// Автосводка в 17:00 UTC = 20:00 МСК
cron.schedule(
  '0 17 * * *',
  async () => {
    console.log('🕔 Cron запустился, собираю сводки...')
    const userIds = await getAllChatIds()
    console.log(`👥 Найдено пользователей: ${userIds.length}`)
    for (const chatId of userIds) {
      try {
        const messages = await getMessages(chatId)
        if (messages.length === 0) {
          console.log(`⏭️ Пропускаю ${chatId} — нет заметок`)
          continue
        }
        const date = new Date().toLocaleDateString('ru-RU', {
          timeZone: 'Europe/Moscow',
        })
        const list = messages
          .map(
            (m, i) =>
              `${i + 1}. [${new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })}] ${m.text}`
          )
          .join('\n')
        const summary = await generateSummary(chatId)
        await bot.sendMessage(
          chatId,
          `📋 *Сводка за ${date}*\n\n📝 *Заметки:*\n${list}\n\n🤖 *Анализ:*\n${summary}`,
          {
            parse_mode: 'Markdown',
          }
        )
        console.log(`✅ Сводка отправлена: ${chatId}`)
        await clearMessages(chatId)
      } catch (err) {
        console.error(`❌ Ошибка сводки для ${chatId}:`, err)
      }
    }
  },
  { timezone: 'UTC' }
)

// HTTP сервер для пинга cron-job.org
http
  .createServer((_, res) => {
    res.writeHead(200)
    res.end('OK')
  })
  .listen(process.env.PORT ?? 3000, () => {
    console.log('🌐 HTTP server started')
  })

// Graceful shutdown для Render
process.once('SIGTERM', () => {
  console.log('Stopping bot...')
  bot.stopPolling()
})

// Обработка ошибок polling
bot.on('polling_error', (err: any) => {
  if (err.code === 'ETELEGRAM' && err.message.includes('409')) {
    console.log('⚠️ Another instance running, waiting...')
  } else {
    console.error('Polling error:', err)
  }
})
