import type { Ref } from 'vue'
import type { useMessagingStore } from '@/store/messaging.store'
import type { ViewConversation } from '../types'
import { entityId, isArchivedConversation, type ConversationLike } from '../conversationHelpers'

type MessagingStore = ReturnType<typeof useMessagingStore>

interface ConversationActionsOptions {
  store: MessagingStore
  selected: Ref<ViewConversation | null>
  userId: () => string | null
  /** Recharge la conversation ouverte (favori modifié : son détail change). */
  reload: (conversation: ViewConversation) => void
  /** Ferme la conversation ouverte, chargement en cours compris. */
  close: () => void
  /** Ferme les menus ouverts une fois l'action faite. */
  closeMenus: () => void
}

/**
 * Actions de liste sur une conversation : favori, lu / non lu, archivage et
 * suppression. Communes à la colonne de gauche et à l'en-tête de la conversation.
 */
export function useConversationActions({ store, selected, userId, reload, close, closeMenus }: ConversationActionsOptions) {
  const isSelected = (conversation: ViewConversation) =>
    selected.value !== null && entityId(selected.value) === entityId(conversation)

  /**
   * La conversation retirée de la vue courante ne doit plus rester ouverte, ni
   * revenir quand son chargement, encore en cours, se termine.
   */
  function deselect(conversation: ViewConversation): void {
    if (isSelected(conversation)) close()
  }

  async function toggleFavorite(conversation: ViewConversation): Promise<void> {
    try {
      closeMenus()
      await store.favorite(entityId(conversation))
      await store.fetchConversations()
      if (selected.value) reload(selected.value)
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error)
    }
  }

  /** « Non lu » reste local : l'API ne sait que marquer une conversation lue. */
  async function toggleRead(conversation: ViewConversation): Promise<void> {
    try {
      if ((conversation.unreadCount ?? 0) > 0) {
        await store.markAsRead(entityId(conversation))
        conversation.unreadCount = 0
      } else {
        conversation.unreadCount = 1
      }
      closeMenus()
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
    }
  }

  async function toggleArchive(conversation: ViewConversation): Promise<void> {
    const archived = isArchivedConversation(conversation as ConversationLike, userId())
    const question = archived
      ? 'Êtes-vous sûr de vouloir désarchiver cette conversation ?'
      : 'Êtes-vous sûr de vouloir archiver cette conversation ?'
    if (!confirm(question)) return

    try {
      if (archived) {
        await store.unarchiveConversation(entityId(conversation))
      } else {
        await store.archiveConversation(entityId(conversation))
      }
      deselect(conversation)
      closeMenus()
      await store.fetchConversations()
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error)
    }
  }

  async function remove(conversation: ViewConversation): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return

    try {
      // Le store retire lui-même la conversation de sa liste.
      await store.deleteConversation(entityId(conversation))
      deselect(conversation)
      closeMenus()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  return { toggleFavorite, toggleRead, toggleArchive, remove }
}
