<template>
  <div ref="container" class="messages-area">
    <div v-if="loadingOlder" class="loading-more-messages">
      <i class="bi bi-arrow-clockwise"></i>
      <span>Chargement...</span>
    </div>
    <MessageBubble
      v-for="message in messages"
      :key="entityId(message)"
      :message="message"
      :own="isOwnMessage(message, userId)"
      :offer-status="findOfferStatus(conversation, message)"
      @open-attachments="(urls, index) => emit('open-attachments', urls, index)"
      @cancel-offer="(offer) => emit('cancel-offer', offer)"
      @accept-offer="(offer) => emit('accept-offer', offer)"
      @decline-offer="(offer) => emit('decline-offer', offer)"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Fil des messages de la conversation ouverte, avec chargement des messages
 * plus anciens quand la lecture approche du haut.
 */
import { nextTick, ref, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import MessageBubble from './MessageBubble.vue'
import { entityId, findOfferStatus, isOwnMessage, type ConversationLike } from '../conversationHelpers'
import type { ViewMessage } from '../types'

/** Distance au haut du fil (px) en deçà de laquelle la page précédente est demandée. */
const LOAD_OLDER_THRESHOLD = 50

const props = defineProps<{
  messages: ViewMessage[]
  conversation: ConversationLike | null
  userId: string | null
  loadingOlder: boolean
  hasMore: boolean
}>()

const emit = defineEmits<{
  'load-older': []
  'open-attachments': [urls: string[], index: number]
  'cancel-offer': [message: ViewMessage]
  'accept-offer': [message: ViewMessage]
  'decline-offer': [message: ViewMessage]
}>()

const container = ref<HTMLElement | null>(null)

function scrollToBottom(): void {
  if (container.value) container.value.scrollTop = container.value.scrollHeight
}

useEventListener(container, 'scroll', () => {
  if (!container.value) return
  if (container.value.scrollTop < LOAD_OLDER_THRESHOLD && props.hasMore && !props.loadingOlder) {
    emit('load-older')
  }
})

/** Vrai quand `next` est `previous` précédé de messages plus anciens. */
function isPrepend(next: ViewMessage[], previous: ViewMessage[] | undefined): boolean {
  if (!previous?.length || next.length <= previous.length) return false
  return entityId(next[next.length - previous.length]) === entityId(previous[0])
}

// Des messages ajoutés au-dessus repoussent le contenu vers le bas : sans
// correction, la lecture saute et déclenche d'autres chargements en cascade.
// Mesure avant le rendu (`flush: 'pre'`, le DOM montre encore l'ancienne liste),
// correction après.
watch(
  () => props.messages,
  (next, previous) => {
    const element = container.value
    if (!element || !isPrepend(next, previous)) return

    const previousHeight = element.scrollHeight
    const previousTop = element.scrollTop
    void nextTick(() => {
      element.scrollTop = element.scrollHeight - previousHeight + previousTop
    })
  },
  { flush: 'pre' }
)

defineExpose({ scrollToBottom })
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/message_thread.scss';
</style>
