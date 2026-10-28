import { computed, ref, type Ref } from 'vue'
import { followCheckoutResult, type CheckoutResult } from '@/components/checkout/followCheckoutResult'
import type { ViewConversation } from '../types'

/** Achat de l'article d'une conversation, au prix négocié s'il a été accepté. */
export function useCheckout(selected: Ref<ViewConversation | null>, showError: (message: string) => void) {
  const checkoutOpen = ref(false)

  const productPrice = computed(() => {
    const conversation = selected.value
    if (!conversation) return 0
    const accepted = conversation.negotiation?.status === 'accepted' ? conversation.negotiation.currentOffer : null
    return accepted ?? conversation.productId?.price ?? 0
  })

  function onConfirmed(result: CheckoutResult | null | undefined): void {
    checkoutOpen.value = false
    followCheckoutResult(result, showError)
  }

  return { checkoutOpen, productPrice, onConfirmed }
}
