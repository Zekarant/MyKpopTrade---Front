<template>
    <!-- Right Sidebar (User/Transaction Info) -->
    <div class="right-sidebar">
      <!-- User Information -->
      <div class="user-section">
        <div class="user-header">
          <div class="user-avatar" v-html="avatarHtml((conversation.otherParticipant || conversation.participants?.[0] || conversation))"></div>
          <div class="user-details">
            <h3>{{ conversation.otherParticipant?.username || conversation.participants?.[0]?.username || conversation.username }}</h3>
            <p class="user-status" :class="{ online: conversation.otherParticipant?.isOnline }">
              <!--{{ conversation.otherParticipant?.isOnline ? 'En ligne' : 'Hors ligne' }}-->
            </p>
            <div class="user-badges">
              <span class="badge verified" v-if="conversation.otherParticipant?.isVerified">
                <i class="bi bi-patch-check"></i>
                Vérifié
              </span>
              <span class="badge pro" v-if="conversation.participants?.isPro">
                <i class="bi bi-star"></i>
                Pro
              </span>
            </div>
          </div>
          <button @click="emit('close')" @click.stop class="close-btn-information-mobile">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-label">Membre depuis</span>
            <span class="stat-value">{{ formatLongDate(conversation.otherParticipant?.createdAt) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Transactions</span>
            <span class="stat-value">{{ conversation.otherParticipant?.transactionCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Note</span>
            <span class="stat-value">
              <i class="bi bi-star-fill"></i>
              {{ conversation.otherParticipant?.rating || 'N/A' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Product/Transaction Context -->
      <div class="transaction-section" v-if="conversation.productContext || conversation.context || conversation.productId">
        <div class="section-header">
          <h3>{{ transactionTitle(conversation) }}</h3>
          <span class="transaction-status" :class="transactionStatus(conversation)">
            {{ transactionStatusLabel(conversation) }}
          </span>
        </div>

        <div class="product-card" v-if="product">
          <img :src="API_URL+product.images[0]" alt="Product" />
          <div class="product-info">
            <h4>{{ product.title }}</h4>
            <p class="product-kpopMember">{{ product.kpopMember }}, {{ product.kpopGroup }} </p>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-details">
              <div class="detail-row">
                <span>Prix</span>
                <span class="price">{{ product.price }}</span>
              </div>
              <div class="detail-row" v-if="product.type">
                <span>Type</span>
                <span>{{ product.type }}</span>
              </div>
              <div class="detail-row" v-if="product.condition">
                <span>État</span>
                <span>{{ product.condition }}</span>
              </div>
              <div class="detail-row" v-if="product.categoryLabel">
                <span class="category-label">{{ product.categoryLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="transaction-actions" v-if="actions.visible">
          <button
            class="btn-outline"
            @click="emit('cancel-transaction')"
            v-if="actions.canCancel"
          >
            <i class="bi bi-x-circle"></i>
            Annuler la transaction
          </button>
          <button
            class="btn-success"
            @click="emit('confirm-received')"
            v-if="actions.canConfirmReceived"
          >
            <i class="bi bi-check-circle"></i>
            J'ai reçu mon article
          </button>
          <button
            class="btn-primary"
            @click="emit('mark-as-sent')"
            v-if="actions.canMarkAsSent"
          >
            <i class="bi bi-truck"></i>
            Marquer comme envoyé
          </button>
        </div>
      </div>

      <div class="media-section" v-if="conversation?.media?.length">
        <h3 class="section-title">Médias partagés</h3>
        <div class="media-grid">
          <div
            v-for="(media, index) in conversation.media.slice(0, 4)"
            :key="index"
            class="media-item"
            :class="`media-${index + 1}`"
            :data-has-more="index === 3 && conversation.media.length > 4"
            :data-count="index === 3 && conversation.media.length > 4 ? `+${conversation.media.length - 4}` : ''"
            @click="emit('open-media', conversationMediaUrls(conversation), index)"

          >
            <img :src="attachmentUrl(media.messageId, media.filename)" alt="Media">
            <div v-if="index === 3 && conversation.media.length > 4" class="media-overlay">
              <span class="media-count">+{{ conversation.media.length - 4 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Barre latérale droite de la messagerie : interlocuteur, encadré transaction
 * (produit, statut, actions) et médias partagés. Composant d'affichage.
 */
import { computed } from 'vue'
import { API_URL } from '@/config/api'
import {
  formatLongDate,
  transactionActions,
  transactionStatus,
  transactionStatusLabel,
  transactionTitle
} from '../conversationHelpers'
import { avatarHtml } from '../avatar'
import { attachmentUrl, conversationMediaUrls } from '../attachments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- conversation de l'API non typée côté front
const props = defineProps<{ conversation: any }>()

const emit = defineEmits<{
  close: []
  'cancel-transaction': []
  'confirm-received': []
  'mark-as-sent': []
  'open-media': [urls: string[], index: number]
}>()

const product = computed(() => props.conversation?.productContext || props.conversation?.productId)
const actions = computed(() => transactionActions(props.conversation))
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/conversation_info_panel.scss';
</style>
