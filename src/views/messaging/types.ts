import type { Conversation, ConversationMedia, IUserParticipant, Message } from '@/types/messaging.types'

/** Participant affiché, avec sa présence quand elle est connue. */
export type ViewParticipant = IUserParticipant & { isOnline?: boolean }

/** Conversation telle qu'affichée : champs du back et état chargé côté front. */
export type ViewConversation = Omit<Conversation, 'participants' | 'otherParticipant'> & {
  id?: string
  username?: string
  participants: ViewParticipant[]
  otherParticipant?: ViewParticipant
  favoritedBy?: string[]
  archivedBy?: string[]
  media?: ConversationMedia[]
  messages?: Message[]
}

export type ViewMessage = Message & { id?: string }
