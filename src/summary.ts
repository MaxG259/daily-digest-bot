// логика сводки
import Groq from 'groq-sdk'
import { getMessages } from './storage'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function generateSummary(chatId: number): Promise<string | null> {
  const messages = getMessages(chatId)

  if (messages.length === 0) return null

  const list = messages.map((m) => `[${m.time}] ${m.text}`).join('\n')

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

  return response.choices[0].message.content
}
