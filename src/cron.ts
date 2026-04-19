import cron from 'node-cron'
import TelegramBot from 'node-telegram-bot-api'
import { generateSummary } from './services/aiService'
import {
  getChatIdsWithPendingMessages,
  getMessagesForPeriod,
  markMessagesAsSent,
} from './services/messageService'
import { formatDateMSK } from './utils/dateUtils'
import { formatMessageList } from './utils/formatMessages'

export function startCron(bot: TelegramBot): void {
  // 17:00 UTC = 20:00 МСК, каждый день
  cron.schedule(
    '0 17 * * *',
    async () => {
      console.log('🕔 Cron запустился, собираю сводки...')

      const chatIds = await getChatIdsWithPendingMessages()
      console.log(`👥 Пользователей с заметками: ${chatIds.length}`)

      for (const chatId of chatIds) {
        try {
          const messages = await getMessagesForPeriod(chatId)

          if (messages.length === 0) {
            console.log(`⏭️ Пропускаю ${chatId} — нет заметок`)
            continue
          }

          const date = formatDateMSK(new Date())
          const list = formatMessageList(messages)
          const summary = await generateSummary(messages)

          await bot.sendMessage(chatId, `📋 *Сводка за ${date}*`, {
            parse_mode: 'Markdown',
          })
          await bot.sendMessage(
            chatId,
            `📝 Заметки:\n${list}\n\n🤖 Анализ:\n${summary}`
          )

          // Помечаем как отправленные — НЕ удаляем
          await markMessagesAsSent(chatId)

          console.log(`✅ Сводка отправлена: ${chatId}`)
        } catch (err) {
          console.error(`❌ Ошибка сводки для ${chatId}:`, err)
        }
      }
    },
    { timezone: 'UTC' }
  )

  console.log('⏰ Cron запланирован: 17:00 UTC (20:00 МСК)')
}
