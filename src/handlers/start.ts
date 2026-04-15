import TelegramBot from 'node-telegram-bot-api'

export async function handleStart(bot: TelegramBot, chatId: number): Promise<void> {
  await bot.sendMessage(
    chatId,
    `👋 Привет! Я твой личный дневник мыслей.\n\nПросто пиши мне что угодно в течение дня — идеи, планы, мысли, заметки.\n\nКаждый день в *20:00 МСК* я пришлю тебе сводку всего, что ты написал.\n\n*Команды:*\n/list — показать заметки текущего периода\n/summary — получить сводку прямо сейчас`,
    { parse_mode: 'Markdown' }
  )
}
