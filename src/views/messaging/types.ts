import type { Conversation, ConversationMedia, IUserParticipant, Message } from '@/types/messaging.types'

/** Conversation telle qu'affichée : champs du back et état chargé côté front. */
export type ViewConversation = Omit<Conversation, 'participants'> & {
  id?: string
  username?: string
  participants: (IUserParticipant & { isOnline?: boolean })[]
  favoritedBy?: string[]
  archivedBy?: string[]
  media?: ConversationMedia[]
  messages?: Message[]
}

export type ViewMessage = Message & { id?: string }
