import { IMessage } from '../models/Message'
import { formatTimeMSK } from './dateUtils'

/**
 * Превращает массив заметок в нумерованный список с временными метками
 */
export function formatMessageList(messages: IMessage[]): string {
  return messages
    .map((m, i) => `${i + 1}. [${formatTimeMSK(m.createdAt)}] ${m.text}`)
    .join('\n')
}
