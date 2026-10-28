<template>
    <!-- Sidebar Navigation -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="user-profile">
          <div class="avatar">
            <UserAvatar :user="userInfo" />
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
          <span v-if="counts.all" class="tab-count">{{ counts.all }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'favorites' }"
          @click="emit('update:activeTab', 'favorites')"
        >
          <i class="bi bi-star"></i>
          <span class="tab-label">Favoris</span>
          <span v-if="counts.favorites" class="tab-count">{{ counts.favorites }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'unread' }"
          @click="emit('update:activeTab', 'unread')"
        >
          <i class="bi bi-envelope"></i>
          <span class="tab-label">Non lus</span>
          <span v-if="counts.unread" class="tab-count">{{ counts.unread }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'archived' }"
          @click="emit('update:activeTab', 'archived')"
        >
          <i class="bi bi-archive"></i>
          <span class="tab-label">Archivées</span>
          <span v-if="counts.archived" class="tab-count">{{ counts.archived }}</span>
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
          <button class="btn-new-conversation" title="Créer une nouvelle conversation" @click="emit('new-conversation')">
            <i class="bi bi-plus-circle"></i>
            <span class="btn-label">Nouveau</span>
          </button>
        </div>

        <div v-if="!loading" class="conversations">
          <div
            v-for="conversation in conversations"
            :key="conversation._id || conversation.id"
            class="conversation-item"
            :class="{
              active: (selectedConversation?._id && selectedConversation._id === conversation._id) ||
            (selectedConversation?.id && selectedConversation.id === conversation.id),
              unread: (conversation.unreadCount ?? 0) > 0,
              favorite: isFavorite(conversation)
            }"
            @click="emit('select', conversation)">

            <div>
              <div class="conversation-avatar">
                <UserAvatar :user="otherParticipant(conversation)" />
              </div>
              <div v-if="otherParticipant(conversation)?.isOnline" class="online-indicator"></div>
            </div>
            <div class="conversation-content">
              <div class="conversation-header">
                <div class="conversation-title">
                  <span class="username">{{ otherParticipant(conversation)?.username || conversation.username }}</span>
                  <i v-if="isFavorite(conversation)" class="bi bi-star-fill favorite-icon"></i>
                </div>
                <span class="timestamp">{{ formatMessageTimestamp(conversation.lastMessageAt || conversation.timestamp) }}</span>
              </div>
              <div class="conversation-preview">
                <span class="message-preview">{{ conversation.lastMessage?.content || conversation.lastMessage }}</span>
                <div v-if="conversation.unreadCount" class="message-badges">
                  <span class="badge">{{ conversation.unreadCount }}</span>
                </div>
              </div>
              <div v-if="conversation.type" class="conversation-status">
                <span class="status-badge" :class="conversation.type">{{ conversationTypeLabel(conversation.type) }}</span>
              </div>
            </div>
            <div class="conversation-actions" @click.stop>
              <button
                class="action-dots-btn"
                :title="'Options'"
                @click="emit('toggle-menu', conversation._id || conversation.id)"
              >
                <i class="bi bi-three-dots"></i>
              </button>
              <!-- Dropdown Menu -->
              <div
                v-if="openMenuId === (conversation._id || conversation.id)"
                class="conversation-dropdown"
                @click.stop
              >
                <button class="dropdown-item" :class="{ favorite: isFavorite(conversation) }" @click="emit('toggle-favorite', conversation)">
                  <i class="bi" :class="isFavorite(conversation) ? 'bi-star-fill' : 'bi-star'"></i>
                  {{ isFavorite(conversation) ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
                </button>
                <button
                  class="dropdown-item"
                  @click="emit('toggle-read', conversation)"
                >
                  <i class="bi" :class="(conversation.unreadCount ?? 0) > 0 ? 'bi-check2-all' : 'bi-check2'"></i>
                  {{ (conversation.unreadCount ?? 0) > 0 ? 'Marquer comme lu' : 'Marquer comme non lu' }}
                </button>
                <button
                  class="dropdown-item"
                  @click="emit('archive', conversation)"
                >
                  <i class="bi bi-archive"></i>
                  {{ isArchived(conversation) ? 'Désarchiver' : 'Archiver' }}
                </button>
                <button
                  class="dropdown-item danger"
                  @click="emit('delete', conversation)"
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
import UserAvatar from '@/components/UserAvatar.vue'
import type { IUser } from '@/types/user.types'
import type { ViewConversation } from '../types'

/** `timestamp` : ancien champ de date, lu en repli de `lastMessageAt`. */
type SidebarConversation = ViewConversation & { timestamp?: string }

const props = defineProps<{
  userInfo: (IUser & { id?: string }) | null
  userId: string | null
  conversations: SidebarConversation[]
  counts: { all: number; favorites: number; unread: number; archived: number }
  activeTab: string
  searchQuery: string
  loading: boolean
  selectedConversation: ViewConversation | null
  openMenuId: string | null | undefined
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: string]
  'update:searchQuery': [query: string]
  select: [conversation: ViewConversation]
  'toggle-menu': [conversationId: string | undefined]
  'toggle-favorite': [conversation: ViewConversation]
  'toggle-read': [conversation: ViewConversation]
  archive: [conversation: ViewConversation]
  delete: [conversation: ViewConversation]
  'new-conversation': []
}>()

const otherParticipant = (conversation: SidebarConversation) => getOtherParticipant(conversation, props.userId)
const isFavorite = (conversation: SidebarConversation) => isFavoriteConversation(conversation, props.userId)
const isArchived = (conversation: SidebarConversation) => isArchivedConversation(conversation, props.userId)
</script>

<style lang="scss" scoped>
@use '../../../css/messaging/conversation_sidebar.scss';
</style>
