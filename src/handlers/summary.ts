import TelegramBot from 'node-telegram-bot-api'
import { getMessagesForPeriod } from '../services/messageService'
import { generateSummary } from '../services/aiService'
import { formatMessageList } from '../utils/formatMessages'
import { formatDateMSK } from '../utils/dateUtils'

export async function handleSummary(bot: TelegramBot, chatId: number): Promise<void> {
  await bot.sendMessage(chatId, '⏳ Формирую сводку...')

  try {
    const messages = await getMessagesForPeriod(chatId)

    if (messages.length === 0) {
      await bot.sendMessage(chatId, '📭 Заметок в текущем периоде нет')
      return
    }

    const date = formatDateMSK(new Date())
    const list = formatMessageList(messages)
    const summary = await generateSummary(messages)

    await bot.sendMessage(
      chatId,
      `📋 *Сводка за ${date}*\n\n📝 *Заметки:*\n${list}\n\n🤖 *Анализ:*\n${summary}`,
      { parse_mode: 'Markdown' }
    )
  } catch (err) {
    console.error('Error in /summary handler:', err)
    await bot.sendMessage(chatId, '❌ Ошибка при создании сводки. Попробуй позже.')
  }
}
