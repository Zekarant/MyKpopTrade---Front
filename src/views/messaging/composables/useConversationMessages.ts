import { ref } from 'vue'
import type { useMessagingStore } from '@/store/messaging.store'
import type { ViewMessage } from '../types'

type MessagingStore = ReturnType<typeof useMessagingStore>

const PAGE_SIZE = 20

interface MessagePagination {
  page: number
  limit: number
  total: number
  pages: number
  hasMore: boolean
}

const firstPage = (): MessagePagination => ({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1, hasMore: true })

/**
 * Messages affichés de la conversation ouverte, page par page.
 *
 * La vue garde sa propre liste plutôt que `store.messages` : les pages
 * anciennes s'y ajoutent au-dessus, et le flux temps réel y ajoute les
 * nouveaux messages sans recharger la conversation.
 */
export function useConversationMessages(store: MessagingStore) {
  const messages = ref<ViewMessage[]>([])
  const pagination = ref<MessagePagination>(firstPage())
  const loadingOlder = ref(false)

  function applyPagination(received?: { page: number; pages: number; total?: number; limit?: number }): void {
    if (!received) return
    pagination.value = { ...pagination.value, ...received, hasMore: received.page < received.pages }
  }

  /** Charge la première page d'une conversation ; `fallback` sert si l'API ne renvoie aucun message. */
  async function load(conversationId: string, fallback: ViewMessage[] = []) {
    pagination.value = firstPage()
    const response = await store.fetchConversation(conversationId)
    messages.value = response.messages || fallback
    applyPagination(response.pagination)
    return response
  }

  /** Ajoute la page précédente au-dessus ; la position de lecture est gardée par MessageThread. */
  async function loadOlder(conversationId: string): Promise<void> {
    if (!conversationId || loadingOlder.value || !pagination.value.hasMore) return

    loadingOlder.value = true
    try {
      const response = await store.fetchConversation(conversationId, {
        page: pagination.value.page + 1,
        limit: pagination.value.limit
      })
      if (response.messages?.length) {
        messages.value = [...response.messages, ...messages.value]
        applyPagination(response.pagination)
      } else {
        // Page vide : plus rien à charger, sinon chaque défilement relancerait la requête.
        pagination.value = { ...pagination.value, hasMore: false }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages', error)
    } finally {
      loadingOlder.value = false
    }
  }

  /**
   * Ajoute un message s'il n'est pas déjà affiché : le même message peut
   * arriver par la réponse d'envoi et par le flux temps réel, dans les deux ordres.
   */
  function append(message: ViewMessage): boolean {
    if (messages.value.some((existing) => existing._id === message._id)) return false
    messages.value.push(message)
    return true
  }

  function clear(): void {
    messages.value = []
    pagination.value = firstPage()
  }

  return { messages, pagination, loadingOlder, load, loadOlder, append, clear }
}
