import { Message } from './models/Message'

export async function addMessage(chatId: number, text: string): Promise<void> {
  await Message.create({ chatId, text })
}

export async function getMessages(chatId: number) {
  return await Message.find({ chatId }).sort({ createdAt: 1 })
}

export async function clearMessages(chatId: number): Promise<void> {
  await Message.deleteMany({ chatId })
}

export async function getAllChatIds(): Promise<number[]> {
  const result = await Message.distinct('chatId')
  return result
}
