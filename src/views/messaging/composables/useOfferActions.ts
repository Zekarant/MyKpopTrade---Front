import { ref, type Ref } from 'vue'
import type { useMessagingStore } from '@/store/messaging.store'
import messagingService from '@/services/messaging.service'
import type { ViewConversation, ViewMessage } from '../types'
import { entityId } from '../conversationHelpers'

type MessagingStore = ReturnType<typeof useMessagingStore>

interface Toast {
  showToastSuccess: (message: string) => void
  showToastError: (message: string) => void
}

/** Offre saisie dans la fenêtre `send_offer`. */
export interface OfferInfo {
  offerData: { productId: string }
  amount: number
  message?: string
}

interface OfferActionsOptions {
  store: MessagingStore
  selected: Ref<ViewConversation | null>
  toast: Toast
  /** Recharge une conversation après une action qui change son statut de négociation. */
  reload: (conversation: ViewConversation) => void
  /** Message d'offre à afficher dans le fil (réponse de l'API à une nouvelle offre). */
  onOfferPosted: (message: ViewMessage) => void
}

/**
 * Négociation depuis la messagerie : faire une offre (acheteur), une
 * contre-offre (vendeur), accepter, refuser ou annuler une offre. Porte aussi
 * l'état d'ouverture des fenêtres correspondantes.
 */
export function useOfferActions({ store, selected, toast, reload, onOfferPosted }: OfferActionsOptions) {
  const offerOpen = ref(false)
  const counterOpen = ref(false)
  const declineOpen = ref(false)
  const submitting = ref(false)
  const counterError = ref('')

  /** Le vendeur répond par une contre-offre, l'acheteur fait une offre. */
  function openOffer(): void {
    if (selected.value?.isOwner) {
      counterError.value = ''
      counterOpen.value = !counterOpen.value
    } else {
      offerOpen.value = !offerOpen.value
    }
  }

  /** Nouvelle offre de l'acheteur. Volontairement sans attente : la fenêtre se ferme tout de suite. */
  function sendOffer(offerInfo: OfferInfo): void {
    offerOpen.value = false
    messagingService.initiateNegotiation({
      productId: offerInfo.offerData.productId,
      initialOffer: offerInfo.amount,
      message: offerInfo.message
    }).then((response) => {
      selected.value = response.conversation
      if (response.conversation.lastMessage) onOfferPosted(response.conversation.lastMessage)
    }).catch((error: Error) => {
      toast.showToastError(error.message || 'Erreur lors de l\'envoi de l\'offre.')
    })
  }

  async function sendCounterOffer(amount: number, message: string): Promise<void> {
    const conversationId = selected.value?._id
    if (!conversationId) {
      counterError.value = 'Conversation invalide.'
      return
    }

    counterError.value = ''
    submitting.value = true
    try {
      // Le store recharge la conversation après l'envoi.
      await store.sendCounterOffer(conversationId, amount, message)
      counterOpen.value = false
    } catch (error) {
      counterError.value = 'Erreur lors de l\'envoi de la contre-offre.'
      console.error(error)
    } finally {
      submitting.value = false
    }
  }

  async function accept(message: ViewMessage): Promise<void> {
    try {
      const response = await store.respondToNegotiation(message.conversation || message.id || '', 'accept')
      toast.showToastSuccess('Offre acceptée avec succès.')
      reload(response.conversation)
    } catch (error) {
      toast.showToastError('Erreur lors de l\'acceptation de l\'offre.')
      console.error('Erreur lors de l\'acceptation de l\'offre:', error)
    }
  }

  async function decline(text: string): Promise<void> {
    try {
      // Le message de refus est le 4e paramètre ; le 3e est le montant d'une contre-offre.
      const response = await store.respondToNegotiation(entityId(selected.value), 'reject', undefined, text)
      declineOpen.value = false
      reload(response.conversation)
    } catch (error) {
      console.error('Erreur lors du refus de l\'offre:', error)
    }
  }

  async function cancel(message: ViewMessage): Promise<void> {
    try {
      const conversation = selected.value
      if (!conversation?.negotiation || !conversation.productId) {
        throw new Error('Aucune offre à annuler dans cette conversation')
      }
      await store.cancelNegotiation(
        conversation.productId._id,
        conversation.negotiation.initialPrice,
        conversation._id,
        entityId(message)
      )
      toast.showToastSuccess('Offre annulée avec succès.')
      reload(conversation)
    } catch (error) {
      toast.showToastError('Erreur lors de l\'annulation de l\'offre.')
      console.error('Erreur lors de l\'annulation de l\'offre:', error)
    }
  }

  return {
    offerOpen,
    counterOpen,
    declineOpen,
    submitting,
    counterError,
    openOffer,
    sendOffer,
    sendCounterOffer,
    accept,
    decline,
    cancel
  }
}
