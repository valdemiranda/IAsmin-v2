import { MessageCreateData } from './types'

/**
 * Validates message data before creation
 * Ensures all required fields are present
 */
export function validateMessageData(data: MessageCreateData): void {
  if (!data.contextId) throw new Error('contextId é obrigatório')
  if (!data.content) throw new Error('content é obrigatório')
  if (!data.role) throw new Error('role é obrigatório')
}

/**
 * Orders messages maintaining conversation context
 * Recursively organizes messages with their replies
 */
export function orderMessagesByConversation(messages: any[]): any[] {
  return messages.reduce((acc: any[], currentMessage: any) => {
    // If message is not a reply, it's a root message
    if (!currentMessage.replyToId) {
      acc.push(currentMessage)
      // Recursively add all replies to this message
      const addReplies = (msg: any) => {
        const replies = messages.filter((m) => m.replyToId === msg.id)
        replies.forEach((reply) => {
          acc.push(reply)
          addReplies(reply)
        })
      }
      addReplies(currentMessage)
    }
    return acc
  }, [])
}
