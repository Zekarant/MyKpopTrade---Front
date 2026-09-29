<template>
          <div
            class="message"
            :class="{ 'own-message': own, 'other-message': !own }"
          >
            <div v-if="!own">
              <div class="message-avatar" v-html="avatarHtml(message.sender)"></div>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div v-if="attachments.length > 0" class="grid-attachements">
                  <div
                    class="message-attachement"
                    v-for="(attachement, index) in attachments.slice(0, 4)"
                    :key="index"
                    :class="{ 'has-more': index === 3 && attachments.length > 4 }"
                    :data-count="index === 3 && attachments.length > 4 ? `+${attachments.length - 4}` : ''" @click="emit('open-attachments', messageAttachmentUrls(message), index)">
                    <img :src="attachmentUrl(message._id || message.id, attachement)">
                  </div>
                </div>
                <p>{{ message.content }}</p>
                <div v-if="message.contentType === 'offer'" class="offer-actions">
                  <!-- Si c'est l'utilisateur actuel qui a envoyé l'offre -->
                  <div class="btn-offer" v-if="own">
                    <!-- Afficher le statut de l'offre -->
                    <div v-if="offerStatus" class="offer-status">
                      <span v-if="offerStatus === 'accepted'" class="status-accepted">
                        <i class="bi bi-check-circle-fill"></i> Acceptée
                      </span>
                      <span v-else-if="offerStatus === 'rejected'" class="status-rejected">
                        <i class="bi bi-x-circle-fill"></i> Refusée
                      </span>
                      <span v-else-if="offerStatus === 'expired'"  class="status-rejected">
                        <i class="bi bi-x-lg"></i> Expirée
                      </span>
                      <span v-else class="status-pending">
                        <i class="bi bi-clock"></i> En attente
                      </span>
                    </div>
                    <div class="cancel-offer" @click="emit('cancel-offer', message)" v-if="offerStatus === 'pending'">
                      Annuler
                    </div>
                  </div>
                  <!-- Si c'est l'autre utilisateur qui a reçu l'offre -->
                  <div class="btns-offers" v-else>
                    <!-- Vérifier si l'offre est déjà acceptée ou refusée -->
                    <div v-if="offerStatus" class="offer-status">
                      <span v-if="offerStatus === 'accepted'" class="status-accepted">
                        <i class="bi bi-check-circle-fill"></i> Vous avez accepté
                      </span>
                      <span v-else-if="offerStatus === 'rejected'" class="status-rejected">
                        <i class="bi bi-x-circle-fill"></i> Vous avez refusé
                      </span>
                      <div v-else-if="offerStatus === 'pending'" style="display: flex;">
                        <button class="btn-outline btn-offer" @click="emit('decline-offer', message)">
                          <i class="bi bi-x-circle"></i>
                          Refuser
                        </button>
                        <button class="btn-success btn-offer" @click="emit('accept-offer', message)">
                          <i class="bi bi-check-circle"></i>
                          Accepter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="message-meta">
                  <span class="message-time">{{ formatMessageTimestamp(message.createdAt || message.timestamp) }}</span>
                  <div v-if="own" class="message-status">
                    <i class="bi" :class="messageStatusIcon(message)"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
</template>

<script setup lang="ts">
/** Un message du fil : texte, pièces jointes et, pour une offre, son statut et ses actions. */
import { computed } from 'vue'
import { formatMessageTimestamp, messageStatusIcon } from '../conversationHelpers'
import { avatarHtml } from '../avatar'
import { attachmentUrl, messageAttachmentUrls } from '../attachments'
import type { ViewMessage } from '../types'

const props = defineProps<{
  /** `timestamp` : ancien champ de date, lu en repli de `createdAt`. */
  message: ViewMessage & { timestamp?: string }
  own: boolean
  offerStatus: string | null
}>()

const emit = defineEmits<{
  'open-attachments': [urls: string[], index: number]
  'cancel-offer': [message: ViewMessage]
  'accept-offer': [message: ViewMessage]
  'decline-offer': [message: ViewMessage]
}>()

// Un message système n'a pas de tableau `attachments`.
const attachments = computed<string[]>(() => props.message?.attachments ?? [])
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/message_bubble.scss';
</style>
