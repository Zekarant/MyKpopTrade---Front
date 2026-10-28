<template>
          <div
            class="message"
            :class="{ 'own-message': own, 'other-message': !own }"
          >
            <div v-if="!own">
              <div class="message-avatar">
                <UserAvatar :user="message.sender" />
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div v-if="attachments.length > 0" class="grid-attachements">
                  <div
                    v-for="(attachement, index) in attachments.slice(0, 4)"
                    :key="index"
                    class="message-attachement"
                    :class="{ 'has-more': index === 3 && attachments.length > 4 }"
                    :data-count="index === 3 && attachments.length > 4 ? `+${attachments.length - 4}` : ''" @click="emit('open-attachments', messageAttachmentUrls(message), index)">
                    <img :src="attachmentUrl(message._id || message.id, attachement)" alt="Pièce jointe" loading="lazy" decoding="async">
                  </div>
                </div>
                <p>{{ message.content }}</p>
                <div v-if="message.contentType === 'offer'" class="offer-actions">
                  <!-- Si c'est l'utilisateur actuel qui a envoyé l'offre -->
                  <div v-if="own" class="btn-offer">
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
                    <div
                      v-if="offerStatus === 'pending'"
                      v-keyboard-click
                      class="cancel-offer"
                      aria-label="Annuler l'offre"
                      @click="emit('cancel-offer', message)"
                    >
                      Annuler
                    </div>
                  </div>
                  <!-- Si c'est l'autre utilisateur qui a reçu l'offre -->
                  <div v-else class="btns-offers">
                    <!-- Vérifier si l'offre est déjà acceptée ou refusée -->
                    <div v-if="offerStatus" class="offer-status">
                      <span v-if="offerStatus === 'accepted'" class="status-accepted">
                        <i class="bi bi-check-circle-fill"></i> Vous avez accepté
                      </span>
                      <span v-else-if="offerStatus === 'rejected'" class="status-rejected">
                        <i class="bi bi-x-circle-fill"></i> Vous avez refusé
                      </span>
                      <div v-else-if="offerStatus === 'pending'" class="d-flex">
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
                  <button
                    v-if="isReportable"
                    type="button"
                    class="message-report-btn"
                    title="Signaler ce message"
                    @click="showReport = true"
                  >
                    <i class="bi bi-flag"></i> Signaler
                  </button>
                </div>
              </div>
            </div>
            <report_card
              v-if="showReport"
              :id="message._id || message.id || ''"
              type="message"
              @close-report="showReport = false"
            ></report_card>
          </div>
</template>

<script setup lang="ts">
/** Un message du fil : texte, pièces jointes et, pour une offre, son statut et ses actions. */
import { computed, ref } from 'vue'
import { vKeyboardClick } from '@/composables/vKeyboardClick'
import { formatMessageTimestamp, messageStatusIcon } from '../conversationHelpers'
import UserAvatar from '@/components/UserAvatar.vue'
import report_card from '@/components/report_card.vue'
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

const showReport = ref(false)
// Seuls les messages écrits par l'interlocuteur se signalent : le back refuse les siens,
// et les messages d'offre ou système sont générés par le serveur.
const isReportable = computed(() =>
  !props.own && props.message.contentType === 'text' && !props.message.isDeleted && Boolean(props.message._id || props.message.id)
)
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/message_bubble.scss';
</style>
