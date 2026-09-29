<template>
    <!-- Sidebar Navigation -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="user-profile">
          <div v-html="avatarHtml(userInfo)" class="avatar">
          </div>
          <div class="user-info">
            <span class="username">{{ userInfo?.username || '@nom_d_utilisateur' }}</span>
            <span class="status"><!--{{ userInfo?.status || 'Hors ligne' }}--> En ligne</span>
          </div>
        </div>
      </div>

      <div class="navigation-tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'all' }"
          @click="emit('update:activeTab', 'all')"
        >
          <i class="bi bi-chat-dots"></i>
          <span class="tab-label">Tous</span>
          <span class="tab-count" v-if="counts.all">{{ counts.all }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'favorites' }"
          @click="emit('update:activeTab', 'favorites')"
        >
          <i class="bi bi-star"></i>
          <span class="tab-label">Favoris</span>
          <span class="tab-count" v-if="counts.favorites">{{ counts.favorites }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'unread' }"
          @click="emit('update:activeTab', 'unread')"
        >
          <i class="bi bi-envelope"></i>
          <span class="tab-label">Non lus</span>
          <span class="tab-count" v-if="counts.unread">{{ counts.unread }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'archived' }"
          @click="emit('update:activeTab', 'archived')"
        >
          <i class="bi bi-archive"></i>
          <span class="tab-label">Archivées</span>
          <span class="tab-count" v-if="counts.archived">{{ counts.archived }}</span>
        </button>
      </div>

      <!-- Messages List -->
      <div class="messages-list">
        <div class="search-section">
          <div class="search-input">
            <i class="bi bi-search"></i>
            <input
              type="text"
              placeholder="Rechercher..."
              :value="searchQuery"
              @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <button class="btn-new-conversation" @click="emit('new-conversation')" title="Créer une nouvelle conversation">
            <i class="bi bi-plus-circle"></i>
            <span class="btn-label">Nouveau</span>
          </button>
        </div>

        <div class="conversations" v-if="!loading">
          <div
            v-for="conversation in conversations"
            :key="conversation._id || conversation.id"
            class="conversation-item"
            :class="{
              active: (selectedConversation?._id && selectedConversation._id === conversation._id) ||
            (selectedConversation?.id && selectedConversation.id === conversation.id),
              unread: conversation.unreadCount > 0,
              favorite: isFavorite(conversation)
            }"
            @click="emit('select', conversation)">

            <div>
              <div class="conversation-avatar" v-html="avatarHtml(otherParticipant(conversation))"></div>
              <div class="online-indicator" v-if="otherParticipant(conversation)?.isOnline"></div>
            </div>
            <div class="conversation-content">
              <div class="conversation-header">
                <div class="conversation-title">
                  <span class="username">{{ otherParticipant(conversation)?.username || conversation.username }}</span>
                  <i class="bi bi-star-fill favorite-icon" v-if="isFavorite(conversation)"></i>
                </div>
                <span class="timestamp">{{ formatMessageTimestamp(conversation.lastMessageAt || conversation.timestamp) }}</span>
              </div>
              <div class="conversation-preview">
                <span class="message-preview">{{ conversation.lastMessage?.content || conversation.lastMessage }}</span>
                <div class="message-badges" v-if="conversation.unreadCount">
                  <span class="badge">{{ conversation.unreadCount }}</span>
                </div>
              </div>
              <div class="conversation-status" v-if="conversation.type">
                <span class="status-badge" :class="conversation.type">{{ conversationTypeLabel(conversation.type) }}</span>
              </div>
            </div>
            <div class="conversation-actions" @click.stop>
              <button
                class="action-dots-btn"
                @click="emit('toggle-menu', conversation._id || conversation.id)"
                :title="'Options'"
              >
                <i class="bi bi-three-dots"></i>
              </button>
              <!-- Dropdown Menu -->
              <div
                class="conversation-dropdown"
                v-if="openMenuId === (conversation._id || conversation.id)"
                @click.stop
              >
                <button @click="emit('toggle-favorite', conversation)" class="dropdown-item" :class="{ favorite: isFavorite(conversation) }">
                  <i class="bi" :class="isFavorite(conversation) ? 'bi-star-fill' : 'bi-star'"></i>
                  {{ isFavorite(conversation) ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
                </button>
                <button
                  @click="emit('toggle-read', conversation)"
                  class="dropdown-item"
                >
                  <i class="bi" :class="conversation.unreadCount > 0 ? 'bi-check2-all' : 'bi-check2'"></i>
                  {{ conversation.unreadCount > 0 ? 'Marquer comme lu' : 'Marquer comme non lu' }}
                </button>
                <button
                  @click="emit('archive', conversation)"
                  class="dropdown-item"
                >
                  <i class="bi bi-archive"></i>
                  {{ isArchived(conversation) ? 'Désarchiver' : 'Archiver' }}
                </button>
                <button
                  @click="emit('delete', conversation)"
                  class="dropdown-item danger"
                >
                  <i class="bi bi-trash"></i>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="loading">
          <i class="bi bi-arrow-clockwise"></i>
          Chargement...
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
/** Colonne de gauche de la messagerie ; composant d'affichage, toute action remonte au parent. */
import {
  conversationTypeLabel,
  formatMessageTimestamp,
  getOtherParticipant,
  isArchivedConversation,
  isFavoriteConversation
} from '../conversationHelpers'
import { avatarHtml } from '../avatar'
import type { ViewConversation } from '../types'

/* eslint-disable @typescript-eslint/no-explicit-any -- conversations de l'API non typées côté front */
const props = defineProps<{
  userInfo: any
  userId: string | null
  conversations: any[]
  counts: { all: number; favorites: number; unread: number; archived: number }
  activeTab: string
  searchQuery: string
  loading: boolean
  selectedConversation: any
  openMenuId: string | null
}>()
/* eslint-enable @typescript-eslint/no-explicit-any */

const emit = defineEmits<{
  'update:activeTab': [tab: string]
  'update:searchQuery': [query: string]
  select: [conversation: ViewConversation]
  'toggle-menu': [conversationId: string]
  'toggle-favorite': [conversation: ViewConversation]
  'toggle-read': [conversation: ViewConversation]
  archive: [conversation: ViewConversation]
  delete: [conversation: ViewConversation]
  'new-conversation': []
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const otherParticipant = (conversation: any): any => getOtherParticipant(conversation, props.userId)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isFavorite = (conversation: any) => isFavoriteConversation(conversation, props.userId)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isArchived = (conversation: any) => isArchivedConversation(conversation, props.userId)
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/conversation_sidebar.scss';
</style>
