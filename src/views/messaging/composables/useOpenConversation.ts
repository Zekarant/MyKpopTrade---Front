import { ref } from 'vue'
import { applyReadReceipt, type ReadReceipt, type useMessagingStore } from '@/store/messaging.store'
import type { BlockStatus } from '@/services/block.service'
import type { ViewConversation, ViewMessage } from '../types'
import { entityId, isOwnMessage } from '../conversationHelpers'
import { useConversationMessages } from './useConversationMessages'

type MessagingStore = ReturnType<typeof useMessagingStore>

interface OpenConversationOptions {
  store: MessagingStore
  userId: () => string | null
  /** Ramène le fil en bas, une fois les nouveaux messages affichés. */
  scrollToBottom: () => Promise<void>
}

/**
 * Conversation ouverte : sélection, chargement de son détail et de ses
 * messages, et suivi du flux temps réel (nouveaux messages, accusés de lecture).
 *
 * En changeant vite de conversation, seule la dernière demandée s'affiche :
 * une réponse arrivée en retard ne remplace ni l'en-tête ni les messages.
 */
export function useOpenConversation({ store, userId, scrollToBottom }: OpenConversationOptions) {
  const selected = ref<ViewConversation | null>(null)
  const loading = ref(false)
  const thread = useConversationMessages(store)
  /** Numéro de la dernière sélection : les plus anciennes s'arrêtent à leur prochain `await`. */
  let latestSelection = 0

  const isOpen = (conversationId: string) => selected.value !== null && entityId(selected.value) === conversationId

  async function select(conversation: ViewConversation): Promise<void> {
    const selection = ++latestSelection
    const isCurrent = () => selection === latestSelection
    const conversationId = entityId(conversation)
    selected.value = conversation

    try {
      loading.value = true
      if ((conversation.unreadCount ?? 0) > 0) {
        await store.markAsRead(conversationId)
        if (!isCurrent()) return
      }

      const response = await thread.load(conversationId, conversation.messages)
      if (!response || !isCurrent()) return
      const detail: ViewConversation = response.conversation
      // Le détail fournit l'interlocuteur complet (badges, statistiques) : la liste ne sert que de repli.
      detail.otherParticipant = detail.otherParticipant ?? conversation.otherParticipant
      detail.media = response.media || []
      selected.value = detail
      await scrollToBottom()
    } catch (error) {
      console.error('Erreur lors de la sélection de la conversation:', error)
    } finally {
      if (isCurrent()) loading.value = false
    }
  }

  function close(): void {
    latestSelection++
    selected.value = null
    loading.value = false
    thread.clear()
  }

  /** Blocage posé ou levé depuis l'ouverture : la saisie suit son état. */
  function applyBlockStatus(status: Partial<BlockStatus>): void {
    if (selected.value) Object.assign(selected.value, status)
  }

  /** Message envoyé depuis cet onglet (réponse HTTP) ou offre tout juste créée. */
  function show(message: ViewMessage): void {
    if (thread.append(message)) void scrollToBottom()
  }

  async function onRealtimeMessage(message: ViewMessage): Promise<void> {
    // Déjà affiché : envoyé depuis cet onglet, ou reçu avant la réponse de l'envoi.
    if (!isOpen(message.conversation) || !thread.append(message)) return

    await scrollToBottom()
    // Conversation sous les yeux (toujours ouverte après le défilement) : le
    // message est lu, l'expéditeur en est averti.
    if (isOpen(message.conversation) && !isOwnMessage(message, userId()) && document.visibilityState === 'visible') {
      await store.markAsRead(message.conversation)
    }
  }

  function onRealtimeReadReceipt(receipt: ReadReceipt): void {
    if (isOpen(receipt.conversationId)) applyReadReceipt(thread.messages.value, receipt)
  }

  // La vue garde sa propre liste de messages affichés : elle suit les actions
  // du store déclenchées par le flux temps réel (cf. store/realtimeSync.ts).
  // Abonnement lié au composant appelant, retiré à son démontage.
  store.$onAction(({ name, args, after }) => {
    if (name === 'handleNewMessage') after(() => onRealtimeMessage(args[0] as ViewMessage))
    else if (name === 'handleConversationRead') after(() => onRealtimeReadReceipt(args[0] as ReadReceipt))
  })

  return {
    selected,
    loading,
    messages: thread.messages,
    pagination: thread.pagination,
    loadingOlder: thread.loadingOlder,
    loadOlder: thread.loadOlder,
    select,
    close,
    show,
    applyBlockStatus
  }
}
