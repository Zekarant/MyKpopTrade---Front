<template>
    <!-- Right Sidebar (User/Transaction Info) -->
    <div class="right-sidebar">
      <!-- User Information -->
      <div class="user-section">
        <div class="user-header">
          <div class="user-avatar" v-html="avatarHtml(other || conversation)"></div>
          <div class="user-details">
            <h3>{{ other?.username || conversation.username }}</h3>
            <div class="user-badges" v-if="other?.isIdentityVerified || other?.isSellerVerified">
              <span class="badge verified" v-if="other?.isIdentityVerified">
                <i class="bi bi-patch-check"></i>
                Vérifié
              </span>
              <span class="badge pro" v-if="other?.isSellerVerified">
                <i class="bi bi-award"></i>
                Certifié
              </span>
            </div>
          </div>
          <button @click="emit('close')" @click.stop class="close-btn-information-mobile">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="user-stats" v-if="stats.memberSince || stats.transactions !== null || stats.rating">
          <div class="stat-item" v-if="stats.memberSince">
            <span class="stat-label">Membre depuis</span>
            <span class="stat-value">{{ formatLongDate(stats.memberSince) }}</span>
          </div>
          <div class="stat-item" v-if="stats.transactions !== null">
            <span class="stat-label">Transactions</span>
            <span class="stat-value">{{ stats.transactions }}</span>
          </div>
          <div class="stat-item" v-if="stats.rating">
            <span class="stat-label">Note</span>
            <span class="stat-value">
              <i v-if="stats.ratingCount > 0" class="bi bi-star-fill"></i>
              {{ stats.rating }}
              <template v-if="stats.ratingCount > 0">({{ stats.ratingCount }})</template>
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
      </div>

      <div class="media-section" v-if="sharedMedia.length">
        <h3 class="section-title">Médias partagés</h3>
        <div class="media-grid">
          <div
            v-for="(media, index) in sharedMedia.slice(0, 4)"
            :key="index"
            class="media-item"
            :class="`media-${index + 1}`"
            :data-has-more="index === 3 && sharedMedia.length > 4"
            :data-count="index === 3 && sharedMedia.length > 4 ? `+${sharedMedia.length - 4}` : ''"
            @click="emit('open-media', conversationMediaUrls(conversation), index)"

          >
            <img :src="attachmentUrl(media.messageId, media.filename)" alt="Media">
            <div v-if="index === 3 && sharedMedia.length > 4" class="media-overlay">
              <span class="media-count">+{{ sharedMedia.length - 4 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
/** Barre latérale droite de la messagerie : interlocuteur, encadré transaction et médias partagés. */
import { computed } from 'vue'
import { API_URL } from '@/config/api'
import {
  formatLongDate,
  getOtherParticipant,
  participantStats,
  transactionStatus,
  transactionStatusLabel,
  transactionTitle
} from '../conversationHelpers'
import { avatarHtml } from '../avatar'
import { attachmentUrl, conversationMediaUrls } from '../attachments'
import type { ProductReference } from '@/types/messaging.types'
import type { TransactionContext } from '../conversationHelpers'
import type { ViewConversation } from '../types'

type InfoProduct = ProductReference & { type?: string; categoryLabel?: string }

type InfoConversation = Omit<ViewConversation, 'productId'> & {
  productId?: InfoProduct | null
  productContext?: InfoProduct & TransactionContext
  context?: TransactionContext
}

const props = defineProps<{ conversation: InfoConversation; userId?: string | null }>()

/** Interlocuteur : fourni par le détail de la conversation, sinon déduit des participants. */
const other = computed(() => getOtherParticipant(props.conversation, props.userId))
const stats = computed(() => participantStats(other.value))

// Pas d'actions de transaction ici : le suivi (expédition, réception, remboursement) est dans la page Paiements.
const emit = defineEmits<{
  close: []
  'open-media': [urls: string[], index: number]
}>()

const product = computed(() => props.conversation?.productContext || props.conversation?.productId)
const sharedMedia = computed<{ messageId: string; filename: string }[]>(() => props.conversation?.media ?? [])
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/conversation_info_panel.scss';
</style>
