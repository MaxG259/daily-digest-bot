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
            `${i + 1}. [${new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}] ${m.text}`
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
      const summary = await generateSummary(chatId)
      if (!summary) {
        await bot.sendMessage(chatId, '📭 Сегодня ты ничего не записывал')
        return
      }
      const date = new Date().toLocaleDateString('ru-RU')
      await bot.sendMessage(chatId, `📋 *Сводка за ${date}*\n\n${summary}`, {
        parse_mode: 'Markdown',
      })
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

// Автосводка в 20:00 по Москве для всех пользователей
cron.schedule(
  '0 20 * * *',
  async () => {
    const userIds = await getAllChatIds()
    for (const chatId of userIds) {
      try {
        const summary = await generateSummary(chatId)
        if (!summary) continue
        const date = new Date().toLocaleDateString('ru-RU')
        await bot.sendMessage(chatId, `📋 *Сводка за ${date}*\n\n${summary}`, {
          parse_mode: 'Markdown',
        })
        await clearMessages(chatId)
      } catch (err) {
        console.error(`Ошибка сводки для ${chatId}:`, err)
      }
    }
  },
  { timezone: 'Europe/Moscow' }
)

// HTTP сервер для пинга cron-job.org — держит бот живым на Render
http
  .createServer((_, res) => {
    res.writeHead(200)
    res.end('OK')
  })
  .listen(process.env.PORT ?? 3000, () => {
    console.log('🤖 Bot started')
  })

// Graceful shutdown для Render
process.once('SIGTERM', () => {
  console.log('Stopping bot...')
  bot.stopPolling()
})

// Не спамить в логах ошибкой 409
bot.on('polling_error', (err: any) => {
  if (err.code === 'ETELEGRAM' && err.message.includes('409')) {
    console.log('⚠️ Another instance running, waiting...')
  } else {
    console.error('Polling error:', err)
  }
})
