import { computed, ref } from 'vue'
import type { useMessagingStore } from '@/store/messaging.store'
import type { ViewConversation } from '../types'
import {
  countConversationsByTab,
  entityId,
  filterConversations,
  findMatchingConversation,
  type ConversationLike
} from '../conversationHelpers'

type MessagingStore = ReturnType<typeof useMessagingStore>

/** Colonne de gauche : onglet, recherche, compteurs, et conversation à ouvrir. */
export function useConversationList(store: MessagingStore, userId: () => string | null) {
  const activeTab = ref('all')
  const searchQuery = ref('')

  const filtered = computed(() =>
    filterConversations((store.sortedConversations || []) as ConversationLike[], {
      tab: activeTab.value,
      query: searchQuery.value,
      userId: userId()
    }) as ViewConversation[]
  )

  const counts = computed(() => countConversationsByTab((store.conversations || []) as ConversationLike[], userId()))

  /** /adherents/messages/:id ouvre cette conversation ; sinon, la plus récente. */
  function initialConversation(requestedId: unknown): ViewConversation | undefined {
    const conversations = store.conversations as ViewConversation[]
    return (requestedId ? conversations.find((c) => entityId(c) === requestedId) : undefined) ?? conversations[0]
  }

  /**
   * Conversation créée depuis la fenêtre « Nouvelle conversation » : jamais de doublon dans la liste.
   * @returns la conversation à ouvrir (celle qui existait déjà, le cas échéant)
   */
  function addCreated(created: ViewConversation): ViewConversation {
    const existing = findMatchingConversation(store.conversations as ViewConversation[], created, userId())
    if (!existing) store.conversations.unshift(created)
    return existing ?? created
  }

  return { activeTab, searchQuery, filtered, counts, initialConversation, addCreated }
}
