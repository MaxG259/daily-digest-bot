import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
import { connectDB } from './db'
import { startCron } from './cron'
import { startServer } from './server'
import { handleStart } from './handlers/start'
import { handleList } from './handlers/list'
import { handleSummary } from './handlers/summary'
import { handleMessage } from './handlers/message'

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: false })

async function start(): Promise<void> {
  await connectDB()
  await bot.deleteWebHook()
  await bot.startPolling()

  startCron(bot)
  startServer()

  console.log('🤖 Bot started')
}

// Роутинг команд
bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text ?? ''

  if (text === '/start') return handleStart(bot, chatId)
  if (text === '/list') return handleList(bot, chatId)
  if (text === '/summary') return handleSummary(bot, chatId)

  // Игнорируем неизвестные команды (начинаются с /)
  if (text.startsWith('/')) {
    await bot.sendMessage(chatId, '❓ Неизвестная команда. Попробуй /start')
    return
  }

  return handleMessage(bot, chatId, text)
})

// Обработка 409 Conflict — две копии бота запущены одновременно
bot.on('polling_error', (err: any) => {
  if (err.code === 'ETELEGRAM' && err.message.includes('409')) {
    console.warn('⚠️ Another instance is running, retrying...')
  } else {
    console.error('Polling error:', err)
  }
})

// Graceful shutdown для Render
process.once('SIGTERM', () => {
  console.log('Stopping bot...')
  bot.stopPolling()
})

start().catch((err) => {
  console.error('Failed to start bot:', err)
  process.exit(1)
})
