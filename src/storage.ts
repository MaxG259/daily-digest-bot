// хранение сообщений
interface Message {
  time: string
  text: string
}

interface UserData {
  messages: Message[]
  timezone: string
}

// Здесь храним данные всех пользователей пока бот работает
// Map — это как объект, но ключом может быть число (chat_id)
const users = new Map<number, UserData>()

export function addMessage(chatId: number, text: string): void {
  if (!users.has(chatId)) {
    users.set(chatId, { messages: [], timezone: 'Europe/Moscow' })
  }

  const time = new Date().toLocaleTimeString('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
  })

  users.get(chatId)!.messages.push({ time, text })
}

export function getMessages(chatId: number): Message[] {
  return users.get(chatId)?.messages ?? []
}

export function getAllUsersWithMessages(): number[] {
  return Array.from(users.entries())
    .filter(([_, data]) => data.messages.length > 0)
    .map(([chatId]) => chatId)
}

export function clearMessages(chatId: number): void {
  const user = users.get(chatId)
  if (user) user.messages = []
}
