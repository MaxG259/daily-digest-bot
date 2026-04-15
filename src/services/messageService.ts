import { IMessage, Message } from '../models/Message'
import { getCurrentPeriod } from '../utils/dateUtils'

/**
 * Сохраняет новую заметку
 */
export async function addMessage(chatId: number, text: string): Promise<void> {
  await Message.create({ chatId, text })
}

/**
 * Возвращает заметки текущего периода (не вошедшие в дайджест)
 * Период: вчера 20:00 МСК → сегодня 20:00 МСК
 */
export async function getMessagesForPeriod(chatId: number): Promise<IMessage[]> {
  const { start, end } = getCurrentPeriod()

  return await Message.find({
    chatId,
    createdAt: { $gte: start, $lt: end },
    digestSentAt: null,
  }).sort({ createdAt: 1 })
}

/**
 * Помечает заметки как отправленные в дайджесте (НЕ удаляет)
 */
export async function markMessagesAsSent(chatId: number): Promise<void> {
  const { start, end } = getCurrentPeriod()

  await Message.updateMany(
    {
      chatId,
      createdAt: { $gte: start, $lt: end },
      digestSentAt: null,
    },
    { digestSentAt: new Date() }
  )
}

/**
 * Возвращает уникальные chatId у которых есть неотправленные заметки в текущем периоде
 */
export async function getChatIdsWithPendingMessages(): Promise<number[]> {
  const { start, end } = getCurrentPeriod()

  const result = await Message.distinct('chatId', {
    createdAt: { $gte: start, $lt: end },
    digestSentAt: null,
  })

  return result as number[]
}
