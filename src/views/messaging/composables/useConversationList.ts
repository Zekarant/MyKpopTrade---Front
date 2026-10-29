import { computed, ref } from 'vue'
import type { useMessagingStore } from '@/store/messaging.store'
import type { ViewConversation } from '../types'
import {
  countConversationsByTab,
  entityId,
  filterConversations,
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

  return { activeTab, searchQuery, filtered, counts, initialConversation }
}
