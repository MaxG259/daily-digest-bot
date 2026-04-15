import TelegramBot from 'node-telegram-bot-api'
import { addMessage } from '../services/messageService'

export async function handleMessage(bot: TelegramBot, chatId: number, text: string): Promise<void> {
  await addMessage(chatId, text)
  await bot.sendMessage(chatId, '✅ Записал')
}
