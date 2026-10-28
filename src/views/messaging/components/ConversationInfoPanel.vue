<template>
    <!-- Right Sidebar (User/Transaction Info) -->
    <div class="right-sidebar" :class="{ active: open }">
      <!-- User Information -->
      <div class="user-section">
        <div class="user-header">
          <div class="user-avatar">
            <UserAvatar :user="other || conversation" />
          </div>
          <div class="user-details">
            <h3>{{ other?.username || conversation.username }}</h3>
            <div v-if="other?.isIdentityVerified || other?.isSellerVerified" class="user-badges">
              <span v-if="other?.isIdentityVerified" class="badge verified">
                <i class="bi bi-patch-check"></i>
                Vérifié
              </span>
              <span v-if="other?.isSellerVerified" class="badge pro">
                <i class="bi bi-award"></i>
                Certifié
              </span>
            </div>
          </div>
          <button type="button" class="close-btn-information-mobile" aria-label="Fermer les informations" @click.stop="emit('close')">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div v-if="stats.memberSince || stats.transactions !== null || stats.rating" class="user-stats">
          <div v-if="stats.memberSince" class="stat-item">
            <span class="stat-label">Membre depuis</span>
            <span class="stat-value">{{ formatLongDate(stats.memberSince) }}</span>
          </div>
          <div v-if="stats.transactions !== null" class="stat-item">
            <span class="stat-label">Transactions</span>
            <span class="stat-value">{{ stats.transactions }}</span>
          </div>
          <div v-if="stats.rating" class="stat-item">
            <span class="stat-label">Note</span>
            <span class="stat-value">
              <i v-if="stats.ratingCount > 0" class="bi bi-star-fill"></i>
              {{ stats.rating }}
              <template v-if="stats.ratingCount > 0">({{ stats.ratingCount }})</template>
            </span>
          </div>
        </div>

        <div v-if="other?._id" class="user-actions">
          <BlockUserButton
            :user-id="other._id"
            :username="other.username"
            :initial-status="blockStatus"
            @change="(status) => emit('block-change', status)"
          />
        </div>
      </div>

      <!-- Product/Transaction Context -->
      <div v-if="conversation.productContext || conversation.context || conversation.productId" class="transaction-section">
        <div class="section-header">
          <h3>{{ transactionTitle(conversation) }}</h3>
          <span class="transaction-status" :class="transactionStatus(conversation)">
            {{ transactionStatusLabel(conversation) }}
          </span>
        </div>

        <div v-if="product" class="product-card">
          <img :src="mediaUrl(product.images[0])" :alt="product.title || 'Article'" loading="lazy" decoding="async" />
          <div class="product-info">
            <h4>{{ product.title }}</h4>
            <p class="product-kpopMember">{{ product.kpopMember }}, {{ product.kpopGroup }} </p>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-details">
              <div class="detail-row">
                <span>Prix</span>
                <span class="price">{{ product.price }}</span>
              </div>
              <div v-if="product.type" class="detail-row">
                <span>Type</span>
                <span>{{ product.type }}</span>
              </div>
              <div v-if="product.condition" class="detail-row">
                <span>État</span>
                <span>{{ product.condition }}</span>
              </div>
              <div v-if="product.categoryLabel" class="detail-row">
                <span class="category-label">{{ product.categoryLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="sharedMedia.length" class="media-section">
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
            <img :src="attachmentUrl(media.messageId, media.filename)" alt="Média partagé" loading="lazy" decoding="async">
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
import { mediaUrl } from '@/utils/format'
import UserAvatar from '@/components/UserAvatar.vue'
import BlockUserButton from '@/components/adherents/BlockUserButton.vue'
import type { BlockStatus } from '@/services/block.service'
import {
  formatLongDate,
  getOtherParticipant,
  participantStats,
  transactionStatus,
  transactionStatusLabel,
  transactionTitle
} from '../conversationHelpers'
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

const props = defineProps<{
  conversation: InfoConversation
  userId?: string | null
  /** Panneau déplié (affichage mobile, où il recouvre la conversation). */
  open?: boolean
}>()

/** Interlocuteur : fourni par le détail de la conversation, sinon déduit des participants. */
const other = computed(() => getOtherParticipant(props.conversation, props.userId))
const stats = computed(() => participantStats(other.value))

// Pas d'actions de transaction ici : le suivi (expédition, réception, remboursement) est dans la page Paiements.
const emit = defineEmits<{
  close: []
  'open-media': [urls: string[], index: number]
  'block-change': [status: BlockStatus]
}>()

/** Situation fournie par le détail de la conversation : le bouton n'a pas à la redemander. */
const blockStatus = computed<BlockStatus>(() => ({
  isBlocked: Boolean(props.conversation.isBlocked),
  blockedByMe: Boolean(props.conversation.blockedByMe)
}))

const product = computed(() => props.conversation?.productContext || props.conversation?.productId)
const sharedMedia = computed<{ messageId: string; filename: string }[]>(() => props.conversation?.media ?? [])
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/conversation_info_panel.scss';
</style>
