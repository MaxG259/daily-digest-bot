import TelegramBot from 'node-telegram-bot-api'
import { getMessagesForPeriod } from '../services/messageService'
import { formatMessageList } from '../utils/formatMessages'

export async function handleList(bot: TelegramBot, chatId: number): Promise<void> {
  const messages = await getMessagesForPeriod(chatId)

  if (messages.length === 0) {
    await bot.sendMessage(chatId, '📭 Заметок в текущем периоде нет')
    return
  }

  const list = formatMessageList(messages)
  await bot.sendMessage(chatId, `📝 *Твои заметки за текущий период:*\n\n${list}`, {
    parse_mode: 'Markdown',
  })
}
