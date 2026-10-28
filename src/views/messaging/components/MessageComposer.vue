<template>
  <div class="message-input-area">
    <div class="attachements-preview-area">
      <div v-for="(preview, index) in previews" :key="index" class="attachment-preview">
        <button type="button" class="btn-delete-attachment" aria-label="Retirer la pièce jointe" @click="removeAttachment(index)">
          <i class="bi bi-x-lg"></i>
        </button>
        <img
          v-keyboard-click
          :src="preview"
          :alt="`Agrandir la pièce jointe ${index + 1}`"
          class="attachment-image"
          @click="emit('preview', [...previews], index)"
        >
      </div>
    </div>
    <p v-if="blocked" class="composer-blocked-notice" role="status">
      <i class="bi bi-slash-circle"></i>
      {{ blockedByMe
        ? 'Vous avez bloqué ce membre : débloquez-le depuis le panneau d\'informations pour lui écrire à nouveau.'
        : 'Vous ne pouvez plus envoyer de messages dans cette conversation.' }}
    </p>
    <div class="input-container">
      <input ref="fileInput" type="file" accept="image/*" hidden multiple @change="addFiles" />

      <button type="button" class="attach-btn" aria-label="Joindre des images" :disabled="blocked" @click="fileInput?.click()">
        <i class="bi bi-paperclip"></i>
      </button>
      <div class="input-wrapper">
        <input
          v-model="text"
          type="text"
          placeholder="Tapez un message..."
          aria-label="Message"
          class="message-input"
          :disabled="sending || blocked"
          @keyup.enter="send"
        />
      </div>
      <button
        type="button"
        class="emoji-btn"
        aria-label="Insérer un emoji"
        :aria-expanded="emojiOpen"
        :disabled="blocked"
        @click.stop="emojiOpen = !emojiOpen"
      >
        <i class="bi bi-emoji-smile"></i>
      </button>
      <button
        type="button"
        class="send-btn"
        aria-label="Envoyer"
        :disabled="!text.trim() || sending || blocked"
        @click="send"
      >
        <i class="bi" :class="sending ? 'bi-arrow-clockwise' : 'bi-send'"></i>
      </button>
    </div>

    <div v-if="emojiOpen" class="emoji-picker-popup" @click.stop>
      <EmojiPicker :native="true" :display-recent="true" @select="insertEmoji" />
    </div>
  </div>
</template>

<script setup lang="ts">
/** Zone de saisie : texte, images jointes et emojis ; envoie le message via le store. */
import { defineAsyncComponent, ref, useTemplateRef } from 'vue'
import { vKeyboardClick } from '@/composables/vKeyboardClick'
import { useEventListener } from '@vueuse/core'
import { useMessagingStore } from '@/store/messaging.store'
import { BLOCKED_ERROR_CODE } from '@/services/block.service'
import { apiErrorCode } from '@/services/apiError'
import type { ViewMessage } from '../types'

// Le sélecteur d'emojis (~150 kB avec sa base d'emojis) n'est chargé qu'à la
// première ouverture du popup (v-if) : la messagerie s'affiche sans l'attendre.
// Sa feuille de style suit le même chunk pour ne pas être injectée d'avance.
const EmojiPicker = defineAsyncComponent(() =>
  Promise.all([import('vue3-emoji-picker'), import('vue3-emoji-picker/css')]).then(([module]) => module.default)
)

const props = defineProps<{
  conversationId: string
  blocked: boolean
  blockedByMe: boolean
}>()

const emit = defineEmits<{
  sent: [message: ViewMessage]
  /** L'API a refusé l'envoi pour cause de blocage posé depuis l'ouverture. */
  blocked: []
  preview: [urls: string[], index: number]
}>()

const messagingStore = useMessagingStore()

const text = ref('')
const files = ref<File[]>([])
const previews = ref<string[]>([])
const sending = ref(false)
const emojiOpen = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

// Tout clic non arrêté ailleurs dans la page ferme le sélecteur d'emojis.
useEventListener(document, 'click', () => {
  emojiOpen.value = false
})

function insertEmoji(emoji: { i: string }): void {
  text.value += emoji.i
  emojiOpen.value = false
}

function addFiles(event: Event): void {
  for (const file of Array.from((event.target as HTMLInputElement | null)?.files ?? [])) {
    files.value.push(file)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') previews.value.push(reader.result)
    }
    reader.readAsDataURL(file)
  }
}

function removeAttachment(index: number): void {
  files.value.splice(index, 1)
  previews.value.splice(index, 1)
}

/** Envoie le brouillon ; sans texte, rien ne part (les images accompagnent un message). */
async function send(): Promise<void> {
  if (!text.value.trim() || sending.value) return

  sending.value = true
  try {
    const response = await messagingStore.sendMessage(props.conversationId, text.value.trim(), files.value)
    emit('sent', response.data)
    text.value = ''
    files.value = []
    previews.value = []
  } catch (error) {
    if (apiErrorCode(error) === BLOCKED_ERROR_CODE) emit('blocked')
    console.error('Erreur lors de l\'envoi du message:', error)
  } finally {
    sending.value = false
  }
}

defineExpose({ send })
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/message_composer.scss';
</style>
