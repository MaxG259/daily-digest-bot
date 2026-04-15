import Groq from 'groq-sdk'
import { IMessage } from '../models/Message'
import { formatMessageList } from '../utils/formatMessages'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

/**
 * Генерирует AI-сводку по списку заметок
 */
export async function generateSummary(messages: IMessage[]): Promise<string> {
  const list = formatMessageList(messages)

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'Ты помощник который анализирует личные заметки человека за день. Отвечай на русском, коротко и по делу.',
      },
      {
        role: 'user',
        content: `Вот мои заметки за день:\n\n${list}\n\nСделай краткую сводку: о чём я думал, что планировал, что важного стоит не забыть. Выдели главное.`,
      },
    ],
  })

  return response.choices[0].message.content ?? 'Не удалось сгенерировать сводку.'
}
