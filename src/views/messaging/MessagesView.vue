<template>
  <div class="messaging-container">
    <!-- Sidebar Navigation -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="user-profile">
          <div class="avatar">
            <img :src="userInfo?.avatar || '/api/placeholder/40/40'" :alt="userInfo?.username || 'Profile'" />
          </div>
          <div class="user-info">
            <span class="username">{{ userInfo?.username || '@nom_d_utilisateur' }}</span>
            <span class="status">{{ userInfo?.status || 'Hors ligne' }}</span>
          </div>
        </div>
      </div>

      <div class="navigation-tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          <i class="bi bi-chat-dots"></i>
          <span class="tab-label">Tous</span>
          <span class="tab-count" v-if="getAllConversationsCount()">{{ getAllConversationsCount() }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'favorites' }"
          @click="activeTab = 'favorites'"
        >
          <i class="bi bi-star"></i>
          <span class="tab-label">Favoris</span>
          <span class="tab-count" v-if="getFavoritesCount()">{{ getFavoritesCount() }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'unread' }"
          @click="activeTab = 'unread'"
        >
          <i class="bi bi-envelope"></i>
          <span class="tab-label">Non lus</span>
          <span class="tab-count" v-if="getUnreadConversationsCount()">{{ getUnreadConversationsCount() }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'archived' }"
          @click="activeTab = 'archived'"
        >
          <i class="bi bi-archive"></i>
          <span class="tab-label">Archivées</span>
          <span class="tab-count" v-if="getArchivedCount()">{{ getArchivedCount() }}</span>
        </button>
      </div>

      <!-- Messages List -->
      <div class="messages-list">
        <div class="search-section">
          <div class="search-input">
            <i class="bi bi-search"></i>
            <input type="text" placeholder="Rechercher..." v-model="searchQuery" />
          </div>
        </div>

        <div class="conversations" v-if="!loading">
          <div
            v-for="conversation in filteredConversations"
            :key="conversation._id || conversation.id"
            class="conversation-item"
            :class="{
              active: selectedConversation?._id === conversation._id || selectedConversation?.id === conversation.id,
              unread: conversation.unreadCount > 0,
              favorite: conversation.isFavorite
            }"
            @click="selectConversation(conversation)"
          >
            <div class="conversation-avatar">
              <img :src="conversation.participants[0]?.avatar || '/api/placeholder/40/40'" :alt="conversation.participants[0]?.username" />
              <div class="online-indicator" v-if="conversation.participants[0]?.isOnline"></div>
            </div>
            <div class="conversation-content">
              <div class="conversation-header">
                <div class="conversation-title">
                  <span class="username">{{ conversation.participants[0]?.username || conversation.username }}</span>
                  <i class="bi bi-star-fill favorite-icon" v-if="conversation.isFavorite"></i>
                </div>
                <span class="timestamp">{{ formatTimestamp(conversation.lastMessageAt || conversation.timestamp) }}</span>
              </div>
              <div class="conversation-preview">
                <span class="message-preview">{{ conversation.lastMessage?.content || conversation.lastMessage }}</span>
                <div class="message-badges" v-if="conversation.unreadCount">
                  <span class="badge">{{ conversation.unreadCount }}</span>
                </div>
              </div>
              <div class="conversation-status" v-if="conversation.type">
                <span class="status-badge" :class="conversation.type">{{ getConversationTypeLabel(conversation.type) }}</span>
              </div>
            </div>
            <div class="conversation-actions" @click.stop>
              <button
                class="action-dots-btn"
                @click="toggleConversationMenu(conversation._id || conversation.id)"
                :title="'Options'"
              >
                <i class="bi bi-three-dots"></i>
              </button>
              <!-- Dropdown Menu -->
              <div
                class="conversation-dropdown"
                v-if="showConversationMenu === (conversation._id || conversation.id)"
                @click.stop
              >
                <button
                  @click="toggleFavorite(conversation)"
                  class="dropdown-item"
                  :class="{ favorite: conversation.isFavorite }"
                >
                  <i class="bi" :class="conversation.isFavorite ? 'bi-star-fill' : 'bi-star'"></i>
                  {{ conversation.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
                </button>
                <button
                  @click="toggleReadStatus(conversation)"
                  class="dropdown-item"
                >
                  <i class="bi" :class="conversation.unreadCount > 0 ? 'bi-check2-all' : 'bi-check2'"></i>
                  {{ conversation.unreadCount > 0 ? 'Marquer comme lu' : 'Marquer comme non lu' }}
                </button>
                <button
                  @click="archiveConversation(conversation)"
                  class="dropdown-item"
                >
                  <i class="bi bi-archive"></i>
                  {{ conversation.isArchived ? 'Désarchiver' : 'Archiver' }}
                </button>
                <button
                  @click="deleteConversation(conversation)"
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

    <!-- Main Chat Area -->
    <div class="chat-area">
      <div v-if="!selectedConversation" class="no-conversation">
        <div class="empty-state">
          <i class="bi bi-chat-dots"></i>
          <h3>Sélectionnez une conversation</h3>
          <p>Choisissez une conversation dans la liste ou démarrez-en une nouvelle</p>
          <button @click="showNewConversationModal = true" class="btn-primary">
            <i class="bi bi-plus"></i>
            Nouvelle conversation
          </button>
        </div>
      </div>

      <div v-else class="active-chat">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-participant">
            <img
              :src="selectedConversation.participants?.[0]?.avatar || selectedConversation.avatar || '/api/placeholder/40/40'"
              :alt="selectedConversation.participants?.[0]?.username || selectedConversation.username"
            />
            <div class="participant-info">
              <div class="participant-name">
                <span class="name">{{ selectedConversation.participants?.[0]?.username || selectedConversation.username }}</span>
                <i class="bi bi-star-fill favorite-icon" v-if="selectedConversation.isFavorite"></i>
              </div>
              <span class="status" :class="{ online: selectedConversation.participants?.[0]?.isOnline }">
                {{ selectedConversation.participants?.[0]?.isOnline ? 'En ligne' : 'Hors ligne' }}
              </span>
            </div>
          </div>
          <div class="chat-actions">
            <button class="action-btn" @click="toggleFavorite(selectedConversation)" :title="selectedConversation.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'">
              <i class="bi" :class="selectedConversation.isFavorite ? 'bi-star-fill' : 'bi-star'"></i>
            </button>
            <button class="action-btn" @click="toggleReadStatus(selectedConversation)" :title="selectedConversation.unreadCount > 0 ? 'Marquer comme lu' : 'Marquer comme non lu'">
              <i class="bi" :class="selectedConversation.unreadCount > 0 ? 'bi-check2-all' : 'bi-check2'"></i>
            </button>
            <button class="action-btn" @click="showConversationOptions = !showConversationOptions" title="Options">
              <i class="bi bi-three-dots"></i>
            </button>
            <!-- Dropdown Options -->
            <div class="dropdown-menu" v-if="showConversationOptions" @click.stop>
              <button @click="archiveConversation(selectedConversation)" class="dropdown-item">
                <i class="bi bi-archive"></i>
                {{ selectedConversation.isArchived ? 'Désarchiver' : 'Archiver' }}
              </button>
              <button @click="deleteConversation(selectedConversation)" class="dropdown-item danger">
                <i class="bi bi-trash"></i>
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="messages-area" ref="messagesContainer">
          <div
            v-for="message in currentMessages"
            :key="message._id || message.id"
            class="message"
            :class="{ 'own-message': isOwnMessage(message), 'other-message': !isOwnMessage(message) }"
          >
            <div v-if="!isOwnMessage(message)" class="message-avatar">
              <img
                :src="selectedConversation.participants?.[0]?.avatar || selectedConversation.avatar || '/api/placeholder/32/32'"
                :alt="selectedConversation.participants?.[0]?.username || selectedConversation.username"
              />
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <p>{{ message.content }}</p>
                <div class="message-meta">
                  <span class="message-time">{{ formatTimestamp(message.createdAt || message.timestamp) }}</span>
                  <div v-if="isOwnMessage(message)" class="message-status">
                    <i class="bi" :class="getMessageStatusIcon(message)"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="message-input-area">
          <div class="input-container">
            <button class="attach-btn" @click="handleAttachment">
              <i class="bi bi-paperclip"></i>
            </button>
            <div class="input-wrapper">
              <input
                type="text"
                v-model="newMessage"
                @keyup.enter="sendMessage"
                placeholder="Tapez un message..."
                class="message-input"
                :disabled="sending"
              />
            </div>
            <button class="emoji-btn" @click="showEmojiPicker = !showEmojiPicker">
              <i class="bi bi-emoji-smile"></i>
            </button>
            <button
              class="send-btn"
              @click="sendMessage"
              :disabled="!newMessage.trim() || sending"
            >
              <i class="bi" :class="sending ? 'bi-arrow-clockwise' : 'bi-send'"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Sidebar (User/Transaction Info) -->
    <div class="right-sidebar" v-if="selectedConversation">
      <!-- User Information -->
      <div class="user-section">
        <div class="user-header">
          <img
            :src="selectedConversation.participants?.[0]?.avatar || selectedConversation.avatar || '/api/placeholder/80/80'"
            :alt="selectedConversation.participants?.[0]?.username || selectedConversation.username"
            class="user-avatar"
          />
          <div class="user-details">
            <h3>{{ selectedConversation.participants?.[0]?.username || selectedConversation.username }}</h3>
            <p class="user-status" :class="{ online: selectedConversation.participants?.[0]?.isOnline }">
              {{ selectedConversation.participants?.[0]?.isOnline ? 'En ligne' : 'Hors ligne' }}
            </p>
            <div class="user-badges">
              <span class="badge verified" v-if="selectedConversation.participants?.[0]?.isVerified">
                <i class="bi bi-patch-check"></i>
                Vérifié
              </span>
              <span class="badge pro" v-if="selectedConversation.participants?.[0]?.isPro">
                <i class="bi bi-star"></i>
                Pro
              </span>
            </div>
          </div>
        </div>

        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-label">Membre depuis</span>
            <span class="stat-value">{{ formatDate(selectedConversation.participants?.[0]?.createdAt) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Transactions</span>
            <span class="stat-value">{{ selectedConversation.participants?.[0]?.transactionCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Note</span>
            <span class="stat-value">
              <i class="bi bi-star-fill"></i>
              {{ selectedConversation.participants?.[0]?.rating || 'N/A' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Product/Transaction Context -->
      <div class="transaction-section" v-if="selectedConversation.productContext || selectedConversation.context">
        <div class="section-header">
          <h3>{{ getTransactionTitle() }}</h3>
          <span class="transaction-status" :class="getTransactionStatus()">
            {{ getTransactionStatusLabel() }}
          </span>
        </div>

        <div class="product-card" v-if="getProductContext()">
          <img :src="getProductContext().image" alt="Product" />
          <div class="product-info">
            <h4>{{ getProductContext().title }}</h4>
            <p class="product-description">{{ getProductContext().description }}</p>
            <div class="product-details">
              <div class="detail-row">
                <span>Prix</span>
                <span class="price">{{ getProductContext().price }}</span>
              </div>
              <div class="detail-row" v-if="getProductContext().type">
                <span>Type</span>
                <span>{{ getProductContext().type }}</span>
              </div>
              <div class="detail-row" v-if="getProductContext().condition">
                <span>État</span>
                <span>{{ getProductContext().condition }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="transaction-actions" v-if="showTransactionActions()">
          <button
            class="btn-outline"
            @click="cancelTransaction"
            v-if="canCancelTransaction()"
          >
            <i class="bi bi-x-circle"></i>
            Annuler la transaction
          </button>
          <button
            class="btn-success"
            @click="confirmReceived"
            v-if="canConfirmReceived()"
          >
            <i class="bi bi-check-circle"></i>
            J'ai reçu mon article
          </button>
          <button
            class="btn-primary"
            @click="markAsSent"
            v-if="canMarkAsSent()"
          >
            <i class="bi bi-truck"></i>
            Marquer comme envoyé
          </button>
        </div>
      </div>
    </div>

    <!-- New Conversation Modal -->
    <div v-if="showNewConversationModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Nouvelle conversation</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="search-member">
            <label>Rechercher un membre :</label>
            <div class="search-input">
              <i class="bi bi-search"></i>
              <input
                type="text"
                v-model="memberSearch"
                @input="searchMembers"
                placeholder="Nom d'utilisateur..."
              />
            </div>

            <div class="search-results" v-if="memberSearchResults.length">
              <div
                v-for="member in memberSearchResults"
                :key="member._id || member.id"
                class="member-result"
                :class="{ selected: selectedMember?._id === member._id || selectedMember?.id === member.id }"
                @click="selectMember(member)"
              >
                <img :src="member.avatar || '/api/placeholder/36/36'" :alt="member.username" />
                <span>{{ member.username }}</span>
              </div>
            </div>
          </div>

          <div class="message-input">
            <label>Message initial :</label>
            <textarea
              v-model="initialMessage"
              rows="4"
              placeholder="Écrivez votre message..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">Annuler</button>
          <button
            @click="startNewConversation"
            :disabled="!selectedMember || creating"
            class="btn-primary"
          >
            <i class="bi" :class="creating ? 'bi-arrow-clockwise' : 'bi-send'"></i>
            {{ creating ? 'Création...' : 'Démarrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useMessagingStore } from '@/store/messaging.store'
import userService from '@/services/user.service'

// Store
const messagingStore = useMessagingStore()

// State
const activeTab = ref('all')
const searchQuery = ref('')
const selectedConversation = ref(null)
const currentMessages = ref([])
const newMessage = ref('')
const showNewConversationModal = ref(false)
const showConversationOptions = ref(false)
const showConversationMenu = ref(null)
const showEmojiPicker = ref(false)
const memberSearch = ref('')
const memberSearchResults = ref([])
const selectedMember = ref(null)
const initialMessage = ref('')
const userInfo = ref(null)
const loading = ref(false)
const sending = ref(false)
const creating = ref(false)

// Computed
const filteredConversations = computed(() => {
  let conversations = messagingStore.sortedConversations || []

  // Filter by tab
  switch (activeTab.value) {
    case 'favorites':
      conversations = conversations.filter(conv => conv.isFavorite && !conv.isArchived)
      break
    case 'unread':
      conversations = conversations.filter(conv => conv.unreadCount > 0 && !conv.isArchived)
      break
    case 'archived':
      conversations = conversations.filter(conv => conv.isArchived)
      break
    case 'all':
    default:
      conversations = conversations.filter(conv => !conv.isArchived)
      break
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    conversations = conversations.filter(conv =>
      (conv.participants?.[0]?.username || conv.username || '').toLowerCase().includes(query) ||
      (conv.lastMessage?.content || conv.lastMessage || '').toLowerCase().includes(query)
    )
  }

  return conversations
})

// Tab counts
const getAllConversationsCount = () => {
  return (messagingStore.conversations || []).filter(conv => !conv.isArchived).length
}

const getFavoritesCount = () => {
  return (messagingStore.conversations || []).filter(conv => conv.isFavorite && !conv.isArchived).length
}

const getUnreadConversationsCount = () => {
  return (messagingStore.conversations || []).filter(conv => conv.unreadCount > 0 && !conv.isArchived).length
}

const getArchivedCount = () => {
  return (messagingStore.conversations || []).filter(conv => conv.isArchived).length
}

// Methods
const isOwnMessage = (message) => {
  const currentUserId = localStorage.getItem('userId') || localStorage.getItem('id_user')
  return message.sender === currentUserId || message.isOwn === true
}

const selectConversation = async (conversation) => {
  selectedConversation.value = conversation
  showConversationOptions.value = false
  showConversationMenu.value = null

  try {
    loading.value = true

    // Mark as read if it has unread messages
    if (conversation.unreadCount > 0) {
      await messagingStore.markAsRead(conversation._id || conversation.id)
    }

    // Fetch conversation details and messages
    const response = await messagingStore.fetchConversation(conversation._id || conversation.id)
    currentMessages.value = response.messages || conversation.messages || []

    // Auto scroll to bottom
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Erreur lors de la sélection de la conversation:', error)
  } finally {
    loading.value = false
  }
}

const toggleConversationMenu = (conversationId) => {
  showConversationMenu.value = showConversationMenu.value === conversationId ? null : conversationId
}

const toggleFavorite = async (conversation) => {
  try {
    conversation.isFavorite = !conversation.isFavorite
    showConversationMenu.value = null

    // TODO: Call API to update favorite status
    await messagingStore.updateConversation(conversation._id || conversation.id, {
      isFavorite: conversation.isFavorite
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des favoris:', error)
    // Revert on error
    conversation.isFavorite = !conversation.isFavorite
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedConversation.value || sending.value) return

  try {
    sending.value = true

    const response = await messagingStore.sendMessage(
      selectedConversation.value._id || selectedConversation.value.id,
      newMessage.value.trim()
    )

    // Add message to current list
    currentMessages.value.push(response.data)
    newMessage.value = ''

    // Auto scroll to bottom
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error)
  } finally {
    sending.value = false
  }
}

const toggleReadStatus = async (conversation) => {
  try {
    if (conversation.unreadCount > 0) {
      await messagingStore.markAsRead(conversation._id || conversation.id)
      conversation.unreadCount = 0
    } else {
      // Mark as unread
      conversation.unreadCount = 1
      // TODO: Call API to mark as unread
    }
    showConversationMenu.value = null
    showConversationOptions.value = false
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error)
  }
}

const archiveConversation = async (conversation) => {
  try {
    conversation.isArchived = !conversation.isArchived
    showConversationMenu.value = null
    showConversationOptions.value = false

    // TODO: Call API to archive/unarchive
    await messagingStore.updateConversation(conversation._id || conversation.id, {
      isArchived: conversation.isArchived
    })

    // If currently selected and archived, clear selection
    if (conversation.isArchived && selectedConversation.value &&
        (selectedConversation.value._id === conversation._id || selectedConversation.value.id === conversation.id)) {
      selectedConversation.value = null
    }
  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error)
    // Revert on error
    conversation.isArchived = !conversation.isArchived
  }
}

const deleteConversation = async (conversation) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return

  try {
    // Remove from store
    const index = messagingStore.conversations.findIndex(c =>
      (c._id || c.id) === (conversation._id || conversation.id)
    )
    if (index !== -1) {
      messagingStore.conversations.splice(index, 1)
    }

    // Clear selection if deleted conversation was selected
    if (selectedConversation.value &&
        (selectedConversation.value._id === conversation._id || selectedConversation.value.id === conversation.id)) {
      selectedConversation.value = null
    }

    showConversationMenu.value = null
    showConversationOptions.value = false

    // TODO: Call API to delete
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  }
}

const searchMembers = async () => {
  if (memberSearch.value.length < 2) {
    memberSearchResults.value = []
    return
  }

  try {
    const response = await userService.getUserByName(memberSearch.value)
    memberSearchResults.value = response.users || []
  } catch (error) {
    console.error('Erreur lors de la recherche:', error)
    memberSearchResults.value = []
  }
}

const selectMember = (member) => {
  selectedMember.value = member
}

const startNewConversation = async () => {
  if (!selectedMember.value || creating.value) return

  try {
    creating.value = true

    const response = await messagingStore.startConversation(
      selectedMember.value._id || selectedMember.value.id,
      null,
      initialMessage.value
    )

    selectedConversation.value = response.conversation
    closeModal()
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error)
  } finally {
    creating.value = false
  }
}

const closeModal = () => {
  showNewConversationModal.value = false
  memberSearch.value = ''
  memberSearchResults.value = []
  selectedMember.value = null
  initialMessage.value = ''
}

const handleAttachment = () => {
  // TODO: Implement file attachment
  console.log('Attachment feature coming soon')
}

const scrollToBottom = () => {
  const container = document.querySelector('.messages-area')
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

// Utility methods
const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return 'maintenant'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getConversationTypeLabel = (type) => {
  const labels = {
    'negotiation': 'Négociation',
    'exchange': 'Échange',
    'sale': 'Vente',
    'general': 'Général'
  }
  return labels[type] || type
}

const getMessageStatusIcon = (message) => {
  if (message.readBy?.length > 1) return 'bi-check2-all text-primary'
  if (message.delivered) return 'bi-check2-all'
  return 'bi-check2'
}

const getProductContext = () => {
  return selectedConversation.value?.productContext || selectedConversation.value?.context?.product
}

const getTransactionTitle = () => {
  const context = selectedConversation.value?.productContext || selectedConversation.value?.context
  if (context?.type === 'negotiation') return 'Négociation'
  if (context?.type === 'exchange') return 'Échange'
  return 'Transaction'
}

const getTransactionStatus = () => {
  const context = selectedConversation.value?.productContext || selectedConversation.value?.context
  return context?.status?.toLowerCase() || 'pending'
}

const getTransactionStatusLabel = () => {
  const context = selectedConversation.value?.productContext || selectedConversation.value?.context
  const status = context?.status
  const labels = {
    'pending': 'En attente',
    'in_progress': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé'
  }
  return labels[status] || status
}

const showTransactionActions = () => {
  const context = selectedConversation.value?.productContext || selectedConversation.value?.context
  return context && ['pending', 'in_progress'].includes(context.status)
}

const canCancelTransaction = () => {
  const context = selectedConversation.value?.productContext || selectedConversation.value?.context
  return context && context.status === 'pending'
}

const canConfirmReceived = () => {
  const context = selectedConversation.value?.productContext || selectedConversation.value?.context
  return context && context.status === 'in_progress' && !context.isOwner
}

const canMarkAsSent = () => {
  const context = selectedConversation.value?.productContext || selectedConversation.value?.context
  return context && context.status === 'pending' && context.isOwner
}

const cancelTransaction = async () => {
  if (!confirm('Êtes-vous sûr de vouloir annuler cette transaction ?')) return

  try {
    // TODO: Call API to cancel transaction
    const context = selectedConversation.value?.productContext || selectedConversation.value?.context
    if (context) {
      context.status = 'cancelled'
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error)
  }
}

const confirmReceived = async () => {
  try {
    // TODO: Call API to confirm reception
    const context = selectedConversation.value?.productContext || selectedConversation.value?.context
    if (context) {
      context.status = 'completed'
    }
  } catch (error) {
    console.error('Erreur lors de la confirmation:', error)
  }
}

const markAsSent = async () => {
  try {
    // TODO: Call API to mark as sent
    const context = selectedConversation.value?.productContext || selectedConversation.value?.context
    if (context) {
      context.status = 'in_progress'
    }
  } catch (error) {
    console.error('Erreur lors du marquage:', error)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    loading.value = true

    // Load user info
    const userResponse = await userService.getMyInformation()
    userInfo.value = userResponse.user || userResponse

    // Load conversations
    await messagingStore.fetchConversations()

    // Auto-select first conversation if available
    if (messagingStore.conversations.length > 0) {
      await selectConversation(messagingStore.conversations[0])
    }
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
  } finally {
    loading.value = false
  }
})

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  showConversationOptions.value = false
  showConversationMenu.value = null
  showEmojiPicker.value = false
})
</script>

<style scoped>
/* Base styles - White theme only */
.messaging-container {
  display: flex;
  height: 100vh;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 350px;
  background: white;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-profile .avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e9ecef;
}

.user-profile .avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  font-size: 16px;
  color: #212529;
}

.status {
  font-size: 13px;
  color: #6c757d;
}

/* Improved Navigation Tabs - Equal Width */
.navigation-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.tab {
  padding: 12px 8px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  color: #6c757d;
  transition: all 0.2s;
  position: relative;
  min-height: 70px;
}

.tab:hover {
  background: #f8f9fa;
  color: #495057;
}

.tab.active {
  color: #0d6efd;
  background: #e7f3ff;
  border-bottom: 3px solid #0d6efd;
}

.tab i {
  font-size: 16px;
  margin-bottom: 2px;
}

.tab-label {
  font-weight: 500;
  font-size: 12px;
  text-align: center;
  line-height: 1.2;
}

.tab-count {
  background: #dc3545;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  position: absolute;
  top: 8px;
  right: 8px;
  font-weight: 600;
}

.tab.active .tab-count {
  background: #0d6efd;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.search-section {
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input i {
  position: absolute;
  left: 12px;
  color: #6c757d;
  z-index: 1;
}

.search-input input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #dee2e6;
  border-radius: 25px;
  background: white;
  outline: none;
  font-size: 14px;
  transition: all 0.2s;
}

.search-input input:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.conversations {
  padding: 0;
}

/* Enhanced Conversation Items */
.conversation-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f8f9fa;
  position: relative;
}

.conversation-item:hover {
  background: #f8f9fa;
}

.conversation-item.active {
  background: #e7f3ff;
  border-left: 4px solid #0d6efd;
}

.conversation-item.unread {
  background: #fff3cd;
}

.conversation-item.unread.active {
  background: #e7f3ff;
}

.conversation-item.favorite {
  border-left: 4px solid #ffc107;
}

.conversation-item.favorite.active {
  border-left: 4px solid #0d6efd;
}

.conversation-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  border: 2px solid #e9ecef;
}

.conversation-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.online-indicator {
  width: 14px;
  height: 14px;
  background: #28a745;
  border: 2px solid white;
  border-radius: 50%;
  position: absolute;
  bottom: 2px;
  right: 2px;
}

.conversation-content {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.conversation-header .username {
  font-weight: 600;
  font-size: 15px;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-icon {
  color: #ffc107;
  font-size: 12px;
  flex-shrink: 0;
}

.timestamp {
  font-size: 12px;
  color: #6c757d;
  flex-shrink: 0;
}

.conversation-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-preview {
  font-size: 14px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;
}

.conversation-item.unread .message-preview {
  font-weight: 600;
  color: #495057;
}

.badge {
  background: #dc3545;
  color: white;
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  font-weight: 600;
}

.conversation-status {
  margin-top: 4px;
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.status-badge.negotiation {
  background: #fff3cd;
  color: #856404;
}

.status-badge.exchange {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.sale {
  background: #d4edda;
  color: #155724;
}

/* Conversation Actions */
.conversation-actions {
  position: relative;
  margin-left: 8px;
  flex-shrink: 0;
}

.action-dots-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s;
  opacity: 0;
}

.conversation-item:hover .action-dots-btn {
  opacity: 1;
}

.action-dots-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.conversation-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  overflow: hidden;
  margin-top: 4px;
}

.conversation-dropdown .dropdown-item {
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #495057;
  transition: background 0.2s;
  font-size: 13px;
}

.conversation-dropdown .dropdown-item:hover {
  background: #f8f9fa;
}

.conversation-dropdown .dropdown-item.favorite {
  color: #ffc107;
}

.conversation-dropdown .dropdown-item.danger {
  color: #dc3545;
}

.conversation-dropdown .dropdown-item.danger:hover {
  background: #f8d7da;
}

.conversation-dropdown .dropdown-item i {
  width: 14px;
  text-align: center;
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.no-conversation {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.empty-state {
  text-align: center;
  color: #6c757d;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  color: #dee2e6;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #495057;
}

.empty-state p {
  margin: 0 0 24px 0;
}

.btn-primary {
  background: #0d6efd;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #0b5ed7;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.active-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Enhanced Chat Header */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chat-participant {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-participant img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid #e9ecef;
}

.participant-info {
  display: flex;
  flex-direction: column;
}

.participant-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.participant-info .name {
  font-weight: 600;
  color: #212529;
  font-size: 16px;
}

.participant-info .status {
  font-size: 13px;
  color: #6c757d;
}

.participant-info .status.online {
  color: #28a745;
}

.chat-actions {
  display: flex;
  gap: 8px;
  position: relative;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6c757d;
}

.action-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.action-btn i.bi-star-fill {
  color: #ffc107;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 160px;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item.danger {
  color: #dc3545;
}

.dropdown-item.danger:hover {
  background: #f8d7da;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
  background-image: linear-gradient(45deg, #f8f9fa 25%, transparent 25%),
                    linear-gradient(-45deg, #f8f9fa 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f8f9fa 75%),
                    linear-gradient(-45deg, transparent 75%, #f8f9fa 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.message {
  display: flex;
  margin-bottom: 16px;
  animation: messageSlideIn 0.3s ease-out;
}

.message.own-message {
  justify-content: flex-end;
}

.message-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  flex-shrink: 0;
  border: 2px solid white;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.other-message .message-bubble {
  background: white;
  border: 1px solid #e9ecef;
}

.own-message .message-bubble {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  color: white;
}

.message-bubble p {
  margin: 0 0 8px 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
}

.message-status {
  margin-left: 8px;
}

.message-status i {
  font-size: 12px;
}

.message-input-area {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  background: white;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
  border-radius: 25px;
  padding: 8px;
}

.attach-btn, .emoji-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s;
}

.attach-btn:hover, .emoji-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.input-wrapper {
  flex: 1;
}

.message-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
  background: white;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-input:focus {
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.send-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: #0d6efd;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
}

.send-btn:hover:not(:disabled) {
  background: #0b5ed7;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

/* Right Sidebar */
.right-sidebar {
  width: 320px;
  background: white;
  border-left: 1px solid #e9ecef;
  overflow-y: auto;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
}

.user-section {
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
}

.user-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #e9ecef;
  object-fit: cover;
}

.user-details h3 {
  margin: 0 0 4px 0;
  color: #212529;
  font-size: 18px;
}

.user-status {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 12px;
}

.user-status.online {
  color: #28a745;
}

.user-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.user-badges .badge {
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-badges .badge.verified {
  background: #d1ecf1;
  color: #0c5460;
}

.user-badges .badge.pro {
  background: #fff3cd;
  color: #856404;
}

.user-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 4px;
}

.transaction-section {
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #212529;
  font-size: 18px;
}

.transaction-status {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

.transaction-status.pending {
  background: #fff3cd;
  color: #856404;
}

.transaction-status.in_progress {
  background: #d1ecf1;
  color: #0c5460;
}

.transaction-status.completed {
  background: #d4edda;
  color: #155724;
}

.transaction-status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.product-card {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.product-card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.product-info {
  padding: 16px;
}

.product-info h4 {
  margin: 0 0 8px 0;
  color: #212529;
  font-size: 16px;
}

.product-description {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.4;
}

.product-details {
  border-top: 1px solid #f8f9fa;
  padding-top: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-row span:first-child {
  color: #6c757d;
}

.detail-row span:last-child {
  color: #495057;
  font-weight: 500;
}

.detail-row .price {
  color: #28a745;
  font-weight: 600;
}

.transaction-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-outline {
  background: white;
  border: 1px solid #e9ecef;
  color: #6c757d;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-outline:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
  color: #495057;
}

.btn-success {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-success:hover {
  background: #218838;
  transform: translateY(-1px);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #212529;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.search-member {
  margin-bottom: 24px;
}

.search-member label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
}

.search-results {
  margin-top: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.member-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f8f9fa;
  transition: background 0.2s;
}

.member-result:hover {
  background: #f8f9fa;
}

.member-result.selected {
  background: #e7f3ff;
  border-color: #0d6efd;
}

.member-result:last-child {
  border-bottom: none;
}

.member-result img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e9ecef;
}

.member-result span {
  font-weight: 500;
  color: #495057;
}

.message-input {
  margin-bottom: 0;
}

.message-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
}

.message-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  background: #f8f9fa;
  transition: all 0.2s;
}

.message-input textarea:focus {
  border-color: #0d6efd;
  background: white;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

/* Loading and animations */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6c757d;
  flex-direction: column;
  gap: 12px;
}

.loading i {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .right-sidebar {
    width: 280px;
  }
}

@media (max-width: 1024px) {
  .right-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .messaging-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: 100vh;
  }

  .chat-area {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 10;
    display: none;
  }

  .chat-area.mobile-active {
    display: flex;
  }

  .sidebar.mobile-hidden {
    display: none;
  }

  .modal {
    width: 95vw;
    margin: 20px;
  }

  .navigation-tabs {
    overflow-x: auto;
  }

  .tab {
    min-width: 80px;
    flex-shrink: 0;
  }
}

/* Scrollbar styling */
.messages-area::-webkit-scrollbar,
.messages-list::-webkit-scrollbar,
.search-results::-webkit-scrollbar,
.right-sidebar::-webkit-scrollbar {
  width: 6px;
}

.messages-area::-webkit-scrollbar-track,
.messages-list::-webkit-scrollbar-track,
.search-results::-webkit-scrollbar-track,
.right-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.messages-area::-webkit-scrollbar-thumb,
.messages-list::-webkit-scrollbar-thumb,
.search-results::-webkit-scrollbar-thumb,
.right-sidebar::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.messages-area::-webkit-scrollbar-thumb:hover,
.messages-list::-webkit-scrollbar-thumb:hover,
.search-results::-webkit-scrollbar-thumb:hover,
.right-sidebar::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* Focus states for accessibility */
.tab:focus,
.action-btn:focus,
.send-btn:focus,
.btn-primary:focus,
.btn-secondary:focus,
.btn-outline:focus,
.btn-success:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Text utilities */
.text-primary {
  color: #0d6efd !important;
}

.text-success {
  color: #28a745 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-muted {
  color: #6c757d !important;
}
</style>
