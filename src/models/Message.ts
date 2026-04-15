import mongoose, { Document } from 'mongoose'

export interface IMessage extends Document {
  chatId: number
  text: string
  createdAt: Date
  digestSentAt: Date | null
}

const messageSchema = new mongoose.Schema<IMessage>({
  chatId: { type: Number, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  digestSentAt: { type: Date, default: null },
})

// Индекс для быстрых запросов по chatId + время
messageSchema.index({ chatId: 1, createdAt: 1 })
messageSchema.index({ chatId: 1, digestSentAt: 1 })

export const Message = mongoose.model<IMessage>('Message', messageSchema)
