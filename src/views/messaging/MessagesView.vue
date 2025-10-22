<template>
  <nav_bar></nav_bar>
  <div class="messaging-container">
    <!-- Sidebar Navigation -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="user-profile">
          <div v-html="getAvatar(userInfo)" class="avatar">
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
              active: (selectedConversation?._id && selectedConversation._id === conversation._id) || 
            (selectedConversation?.id && selectedConversation.id === conversation.id),
              unread: conversation.unreadCount > 0,
              favorite: conversation.isFavorite
            }"
            @click="selectConversation(conversation)">

            <div>
              <div class="conversation-avatar" v-html="getAvatar( conversation.otherParticipant || conversation.participants[0])"></div>
              <div class="online-indicator" v-if="conversation.participants[0]?.isOnline"></div>
            </div>
            <div class="conversation-content">
              <div class="conversation-header">
                <div class="conversation-title">
                  <span class="username">{{ conversation.otherParticipant?.username || conversation.participants[0]?.username || conversation.username }}</span>
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
          <i @click="closeConversation" class="bi bi-chevron-compact-left back-btn"></i>
          <div class="chat-participant">
            <div class="userPicture" v-html="getAvatar(selectedConversation.otherParticipant)"></div>
            <div class="participant-info">
              <div class="participant-name">
                <span class="name">{{ selectedConversation.otherParticipant?.username || selectedConversation.username }}</span>
                <i class="bi bi-star-fill favorite-icon" v-if="selectedConversation.isFavorite"></i>
              </div>
              <span class="status" :class="{ online: selectedConversation.participants?.[0]?.isOnline }">
                {{ selectedConversation.participants?.[0]?.isOnline ? 'En ligne' : 'Hors ligne' }}
              </span>
            </div>
          </div>
          <div class="chat-actions">
            <button v-if="selectedConversation.productId" class="action-btn btn_computer" @click="expandSalesOptions" @click.stop title="sold">
              <i class="bi bi-cash-coin"></i>           
            </button>
            <button class="action-btn btn_computer" @click="toggleFavorite(selectedConversation)" :title="selectedConversation.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'">
              <i class="bi" :class="selectedConversation.isFavorite ? 'bi-star-fill' : 'bi-star'"></i>
            </button>
            <button class="action-btn btn_computer" @click="toggleReadStatus(selectedConversation)" :title="selectedConversation.unreadCount > 0 ? 'Marquer comme lu' : 'Marquer comme non lu'">
              <i class="bi" :class="selectedConversation.unreadCount > 0 ? 'bi-check2-all' : 'bi-check2'"></i>
            </button>
            <button class="action-btn" @click="expandOptions" @click.stop title="Options">
              <i class="bi bi-three-dots"></i>
            </button>
              <!-- Dropdown Options de vente -->
              <div class="dropdown-menu" v-if="showSalesOptions" @click.stop>
                <button @click="sendOfferOption" class="dropdown-item">
                  <i class="bi bi-wallet"></i>      
                  Faire une offre            
                </button>
                <button v-if="!selectedConversation.value?.productContext.isOwner" @click="buyOption" class="dropdown-item">
                  <i class="bi bi-credit-card"></i>                  
                  Acheter
                </button>
              </div>
   
            <!-- Dropdown Options -->
            <div class="dropdown-menu" v-if="showConversationOptions" @click.stop>
              <button @click="archiveConversation(selectedConversation)" class="dropdown-item">
                <i class="bi bi-archive"></i>
                {{ selectedConversation.isArchived ? 'Désarchiver' : 'Archiver' }}
              </button>
              <button @click="showRightBar" class="dropdown-item information">
                <i class="bi bi-info-circle"></i>               
                Information
              </button>
              <button @click="sendOfferOption" class="dropdown-item btn_mobile">
                <i class="bi bi-wallet"></i>      
                Faire une offre            
              </button>
              <button v-if="!selectedConversation.value?.productContext.isOwner"  @click="buyOption" class="dropdown-item btn_mobile">
                <i class="bi bi-credit-card"></i>                  
                Acheter
              </button>     
              <button class="dropdown-item  btn_mobile" @click="toggleFavorite(selectedConversation)" :title="selectedConversation.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'">
                <i class="bi" :class="selectedConversation.isFavorite ? 'bi-star-fill' : 'bi-star'"></i>
                  <span style="display: inline-block;" v-if="selectedConversation.isFavorite">Retirer</span>
                  <span style="display: inline-block;" v-if="!selectedConversation.isFavorite">Ajouter</span>
              </button>        
              <button class="dropdown-item  btn_mobile" @click="toggleReadStatus(selectedConversation)" :title="selectedConversation.unreadCount > 0 ? 'Marquer comme lu' : 'Marquer comme non lu'">
                <i class="bi" :class="selectedConversation.unreadCount > 0 ? 'bi-check2-all' : 'bi-check2'"></i>
                  <span style="display: inline-block;" v-if="selectedConversation.unreadCount > 0">Lu</span>
                  <span style="display: inline-block;" v-if="!selectedConversation.unreadCount > 0">Non lu</span>
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
            <div v-if="!isOwnMessage(message)">
              <div class="message-avatar" v-html="getAvatar(selectedConversation.participants?.[0] || selectedConversation)"></div>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div v-if="message.attachments.length > 0" class="grid-attachements">
                  <div
                    class="message-attachement"
                    v-for="(attachement, index) in message.attachments.slice(0, 4)"
                    :key="index"
                    :class="{ 'has-more': index === 3 && message.attachments.length > 4 }"
                    :data-count="index === 3 && message.attachments.length > 4 ? `+${message.attachments.length - 4}` : ''" @click="openImgList(message.attachments, index)">
                    <img :src="domain_api+'/uploads/chat_attachments/'+attachement">
                  </div>
                </div>
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
          <div class="attachements-preview-area">
            <div  v-for="(attachement, index) in attachmentView" :key="index" class="attachment-preview">
              <div @click="deleteAttachement(index)" class="btn-delete-attachment">
                <i class="bi bi-x-lg"></i>
              </div>
              <img @click="openImgListPreview(attachmentView, index)" :src="attachement" alt="Attachment" class="attachment-image">
            </div>
          </div>
          <div class="input-container">
            
            <!-- input caché + bouton -->
            <input type="file" id="imageUpload" @change="handleImageUpload" accept="image/*" hidden multiple  ref="fileInput"/>

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
            <button class="emoji-btn" @click.stop="showEmojiPicker = !showEmojiPicker">
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

          <!-- Emoji Picker Popup -->
          <div v-if="showEmojiPicker" class="emoji-picker-popup" @click.stop>
            <EmojiPicker 
              :native="true" 
              @select="onSelectEmoji"
              :display-recent="true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Right Sidebar (User/Transaction Info) -->
    <div class="right-sidebar" v-if="selectedConversation">
      <!-- User Information -->
      <div class="user-section">
        <div class="user-header">
          <div class="user-avatar" v-html="getAvatar((selectedConversation.otherParticipant || selectedConversation.participants?.[0] || selectedConversation))"></div>
          <div class="user-details">
            <h3>{{ selectedConversation.otherParticipant?.username || selectedConversation.participants?.[0]?.username || selectedConversation.username }}</h3>
            <p class="user-status" :class="{ online: selectedConversation.otherParticipant?.isOnline }">
              {{ selectedConversation.otherParticipant?.isOnline ? 'En ligne' : 'Hors ligne' }}
            </p>
            <div class="user-badges">
              <span class="badge verified" v-if="selectedConversation.otherParticipant?.isVerified">
                <i class="bi bi-patch-check"></i>
                Vérifié
              </span>
              <span class="badge pro" v-if="selectedConversation.participants?.isPro">
                <i class="bi bi-star"></i>
                Pro
              </span>
            </div>
          </div>
          <button @click="closeInformation" @click.stop class="close-btn-information-mobile">
            <i class="bi bi-x-lg"></i>        
          </button>
        </div>

        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-label">Membre depuis</span>
            <span class="stat-value">{{ formatDate(selectedConversation.otherParticipant?.createdAt) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Transactions</span>
            <span class="stat-value">{{ selectedConversation.otherParticipant?.transactionCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Note</span>
            <span class="stat-value">
              <i class="bi bi-star-fill"></i>
              {{ selectedConversation.otherParticipant?.rating || 'N/A' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Product/Transaction Context -->
      <div class="transaction-section" v-if="selectedConversation.productContext || selectedConversation.context || selectedConversation.productId">
        <div class="section-header">
          <h3>{{ getTransactionTitle() }}</h3>
          <span class="transaction-status" :class="getTransactionStatus()">
            {{ getTransactionStatusLabel() }}
          </span>
        </div>

        <div class="product-card" v-if="getProductContext()">
          <img :src="domain_api+getProductContext().images[0]" alt="Product" />
          <div class="product-info">
            <h4>{{ getProductContext().title }}</h4>
            <p class="product-kpopMember">{{ getProductContext().kpopMember }}, {{ getProductContext().kpopGroup }} </p>
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
              <div class="detail-row" v-if="getProductContext().categoryLabel">
                <span class="category-label">{{ getProductContext().categoryLabel }}</span>
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

      <div class="media-section" v-if="selectedConversation?.media?.length">
        <h3 class="section-title">Médias partagés</h3>
        <div class="media-grid">
          <div 
            v-for="(media, index) in selectedConversation.media.slice(0, 4)" 
            :key="index"
            class="media-item"
            :class="`media-${index + 1}`"
            :data-has-more="index === 3 && selectedConversation.media.length > 4"
            :data-count="index === 3 && selectedConversation.media.length > 4 ? `+${selectedConversation.media.length - 4}` : ''"
            @click="openImgList(selectedConversation.media.map(item => item.filename), index)"

          >
            <img :src="domain_api + '/uploads/chat_attachments/' + media.filename" alt="Media">
            <div v-if="index === 3 && selectedConversation.media.length > 4" class="media-overlay">
              <span class="media-count">+{{ selectedConversation.media.length - 4 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Composant send_message pour nouvelle conversation -->
    <send_message
      v-if="showNewConversationModal"
      @closeSendMessage="closeModal"
      @newConversationCreated="onNewConversationCreated"
    />
    
    <!-- Image Ouvert Modal -->
    <div v-if="openAttachment"  @click.self="closePopupImgList" class="popup-overlay">
      <div class="popup-content" style="height: 100%; flex-direction: column; display: flex; position: relative; min-width: 50%;">
        <button class="close-btn" @click="closePopupImgList">&times;</button>
        <ImageCarousel class="screen" :predefinedIndex="openAttachmentIndex" :images="openAttachmentView" />
      </div>
    </div>
    <!-- Option d'achat Modal -->
    <div class="popup-overlay" v-if="showBuyOption">
      <div @click.stop class="popup-content">
        <div style="cursor: pointer;" @click="initPaypal" >
          <i class="bi bi-paypal"></i>          
          Payer avec PayPal
        </div>
      </div>
    </div>

    <!--Faire offre Modal -->
    <div v-if="showOfferOption && selectedConversation.productId">
      <send_offer @offerSent="handleOfferSent"   @close="showOfferOption = false" :conversation="selectedConversation"></send_offer>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useMessagingStore } from '@/store/messaging.store'
import userService from '@/services/user.service'
import paymentService from '@/services/payment.service'
import nav_bar from '@/components/adherents/nav_bar.vue';
import ImageCarousel from '@/components/ImageCarousel.vue';
import send_message from '@/components/adherents/send_message.vue';
import send_offer from '@/components/send_offer.vue';
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

const showSidebar = ref(false);
// Store
const messagingStore = useMessagingStore()

// State
const activeTab = ref('all')
const searchQuery = ref('')
const selectedConversation = ref(null)
const currentMessages = ref([])
const newMessage = ref('')
const attachments = ref([])
const attachmentView = ref([])
const openAttachmentView = ref([])
const openAttachmentIndex = ref(0)
const openAttachment = ref(false)
const showNewConversationModal = ref(false)
const showConversationOptions = ref(false)
const showSalesOptions = ref(false)
const showBuyOption = ref(false)
const showOfferOption = ref(false)
const showConversationMenu = ref(null)
const showEmojiPicker = ref(false)
const userInfo = ref(null)
const loading = ref(false)
const sending = ref(false)
const domain_api = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  

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

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Methods
const isOwnMessage = (message) => {
  const currentUserId = localStorage.getItem('userId') || localStorage.getItem('id_user') || getCookie('id_user')
  return message.sender._id === currentUserId || message.isOwn === true
}

const getAvatar = (user) => {
  if (!user) {
    return '<img src="https://mykpoptrade.com/images/avatar-default.png" alt="avatar">';
  }
  const profileImgInfo = {
    username: user.username,
    profilePicture: user.profilePicture
  };
  return userService.renderUserAvatar(profileImgInfo);
};

const onSelectEmoji = (emoji) => {
  newMessage.value += emoji.i
  showEmojiPicker.value = false
}

const expandOptions = () => {
  showConversationOptions.value = !showConversationOptions.value
}
const expandSalesOptions = () => {
  showSalesOptions.value = !showSalesOptions.value
}
const selectConversation = async (conversation) => {
  console.log('conversation');
  console.log(conversation);
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
    selectedConversation.value = response.conversation
    selectedConversation.value.otherParticipant = conversation.otherParticipant

    selectedConversation.value.media = response.media || []

    currentMessages.value = response.messages || conversation.messages || []
    document.getElementsByClassName('chat-area')[0].classList.add('active');
    // Auto scroll to bottom
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Erreur lors de la sélection de la conversation:', error)
  } finally {
    loading.value = false
  }
}
const showRightBar = () => {
  expandOptions()
  const rightSidebar = document.querySelector('.right-sidebar')
  if (rightSidebar) {
    rightSidebar.classList.toggle('active')
  }
}
const closeConversation = () => {
  selectedConversation.value = null
  currentMessages.value = []
  newMessage.value = ''
  attachments.value = []
  attachmentView.value = []
  openAttachmentView.value = []
  openAttachmentIndex.value = 0
  openAttachment.value = false
  document.getElementsByClassName('chat-area')[0].classList.remove('active');

}
const toggleConversationMenu = (conversationId) => {
  showConversationMenu.value = showConversationMenu.value === conversationId ? null : conversationId
}

const toggleFavorite = async (conversation) => {
  try {
    conversation.isFavorite = !conversation.isFavorite
    showConversationMenu.value = null

    await messagingStore.updateConversation(conversation._id || conversation.id, {
      isFavorite: conversation.isFavorite
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des favoris:', error)
    conversation.isFavorite = !conversation.isFavorite
  }
}
const handleOfferSent = async (offerInfo) => {
  showOfferOption.value = false
  
  newMessage.value = `💰 J'ai fait une offre de ${offerInfo.amount}€`
  if (offerInfo.message) {
    newMessage.value += ` - ${offerInfo.message}`
  }
  await sendMessage()
}
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedConversation.value || sending.value) return

  try {
    sending.value = true

    const response = await messagingStore.sendMessage(
      selectedConversation.value._id || selectedConversation.value.id,
      newMessage.value.trim(),
      attachments.value
    )

    currentMessages.value.push(response.data)
    newMessage.value = ''
    attachments.value = []
    attachmentView.value = []
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
      conversation.unreadCount = 1
    }
    showConversationMenu.value = null
    showConversationOptions.value = false
    showSalesOptions.value = false
    showBuyOption.value = false
    showOfferOption.value = false

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error)
  }
}
const buyOption = () => {
  showBuyOption.value = ! showBuyOption.value
}
const sendOfferOption = () => {
  console.log(selectedConversation.value)
  showOfferOption.value = !showOfferOption.value
}
const initPaypal = async () => {
  try {
    showBuyOption.value = false;
    console.log(selectedConversation.value)
    const retour_initPayPal = await paymentService.initPayPal(selectedConversation.value.productId._id);
    console.log(retour_initPayPal);
    
    if (retour_initPayPal.success && retour_initPayPal.payment?.approvalUrl) {
      
      console.log('Ouverture PayPal avec iframe...');
      
      const iframeResult = createPaypalIframe(retour_initPayPal.payment.approvalUrl, retour_initPayPal.payment.id);
      
      setTimeout(() => {
        if (iframeResult && iframeResult.isVisible()) {
          console.log('Iframe PayPal active et fonctionnelle');
        } else {
          console.error('Iframe PayPal non fonctionnelle, ouverture nouvel onglet...');
          
          if (iframeResult && iframeResult.close) {
            iframeResult.close();
          }
          
          const newTab = window.open(retour_initPayPal.payment.approvalUrl, '_blank');
          if (newTab) {
            console.log('Nouvel onglet PayPal ouvert');
            handleTabEvents(newTab, retour_initPayPal.payment.id);
          } else {
            console.error('Impossible d\'ouvrir un nouvel onglet');
            alert('Impossible d\'ouvrir PayPal. Veuillez autoriser les popups/onglets ou copier ce lien : ' + retour_initPayPal.payment.approvalUrl);
          }
        }
      }, 500);
      
    } else {
      console.error('Erreur lors de l\'initialisation PayPal:', retour_initPayPal);
      alert('Erreur lors de l\'initialisation du paiement PayPal. Veuillez réessayer.');
    }
  } catch (error) {
    console.error('Erreur PayPal:', error);
    alert('Une erreur est survenue lors de l\'initialisation du paiement PayPal.');
  }
};

const createPaypalIframe = (approvalUrl, paymentId) => {
  try {
    const existingModal = document.getElementById('paypal-iframe-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'paypal-iframe-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      position: relative;
      width: 90%;
      height: 90%;
      max-width: 500px;
      max-height: 700px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      padding: 15px 20px;
      background: #0070ba;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    modalHeader.innerHTML = `
      <span>Paiement PayPal</span>
      <button id="close-paypal-modal" style="
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="Fermer">×</button>
    `;

    const iframe = document.createElement('iframe');
    iframe.src = approvalUrl;
    iframe.style.cssText = `
      width: 100%;
      height: calc(100% - 60px);
      border: none;
      display: block;
    `;

    const loader = document.createElement('div');
    loader.id = 'paypal-loader';
    loader.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      font-family: Arial, sans-serif;
    `;
    loader.innerHTML = `
      <div style="margin-bottom: 10px;">Chargement PayPal...</div>
      <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0070ba; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    let messageHandler = null;
    let iframeLoadHandler = null;
    let iframeErrorHandler = null;
    let isIframeLoaded = false;
    let iframeError = false;

    const closeModal = () => {
      if (messageHandler) {
        window.removeEventListener('message', messageHandler);
      }
      if (iframeLoadHandler) {
        iframe.removeEventListener('load', iframeLoadHandler);
      }
      if (iframeErrorHandler) {
        iframe.removeEventListener('error', iframeErrorHandler);
      }
      if (modal && document.body.contains(modal)) {
        modal.remove();
      }
      console.log('Iframe PayPal fermée');
      checkPaymentStatus(paymentId);
    };

    messageHandler = (event) => {
      if (event.data.p2Sent || event.data.utils) {
        console.log('Message de télémétrie PayPal ignoré');
        return;
      }
      
      if (event.origin !== 'https://www.sandbox.paypal.com' && 
          event.origin !== 'https://www.paypal.com') {
        return;
      }
      
      console.log('Message reçu de PayPal iframe:', event.data);
      
      if (event.data.type === 'payment_success') {
        closeModal();
        onPaymentSuccess(event.data.paymentId || paymentId);
      } else if (event.data.type === 'payment_cancelled') {
        closeModal();
        onPaymentCancelled();
      }
    };

    iframeLoadHandler = () => {
      isIframeLoaded = true;
      const loaderElement = document.getElementById('paypal-loader');
      if (loaderElement) {
        loaderElement.style.display = 'none';
      }
      console.log('Iframe PayPal chargée avec succès');
    };

    iframeErrorHandler = () => {
      iframeError = true;
      console.error('Erreur lors du chargement de l\'iframe PayPal');
    };

    iframe.addEventListener('load', iframeLoadHandler);
    iframe.addEventListener('error', iframeErrorHandler);
    window.addEventListener('message', messageHandler);

    modalHeader.querySelector('#close-paypal-modal').addEventListener('click', closeModal);
    
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });

    const escapeHandler = (event) => {
      if (event.key === 'Escape') {
        document.removeEventListener('keydown', escapeHandler);
        closeModal();
      }
    };
    document.addEventListener('keydown', escapeHandler);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(loader);
    modalContent.appendChild(iframe);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    console.log('Iframe PayPal créée et ajoutée à la page');
    
    setTimeout(() => {
      if (iframe) {
        iframe.focus();
      }
    }, 500);

    return {
      modal: modal,
      iframe: iframe,
      isVisible: () => document.body.contains(modal) && modal.style.display !== 'none',
      isLoaded: () => isIframeLoaded,
      hasError: () => iframeError,
      close: closeModal
    };

  } catch (error) {
    console.error('Erreur lors de la création de l\'iframe PayPal:', error);
    return null;
  }
};

const handleTabEvents = (tabWindow, paymentId) => {
  let checkClosedInterval = null;
  let messageHandler = null;

  const cleanup = () => {
    if (checkClosedInterval) {
      clearInterval(checkClosedInterval);
      checkClosedInterval = null;
    }
    if (messageHandler) {
      window.removeEventListener('message', messageHandler);
      messageHandler = null;
    }
  };

  messageHandler = (event) => {
    if (event.data.p2Sent || event.data.utils) {
      console.log('Message de télémétrie PayPal ignoré');
      return;
    }
    
    if (event.origin !== 'https://www.sandbox.paypal.com' && 
        event.origin !== 'https://www.paypal.com') {
      return;
    }
    
    console.log('Message reçu de PayPal onglet:', event.data);
    
    if (event.data.type === 'payment_success') {
      tabWindow.close();
      cleanup();
      onPaymentSuccess(event.data.paymentId || paymentId);
    } else if (event.data.type === 'payment_cancelled') {
      tabWindow.close();
      cleanup();
      onPaymentCancelled();
    }
  };

  checkClosedInterval = setInterval(() => {
    try {
      if (tabWindow.closed) {
        cleanup();
        console.log('Onglet PayPal fermé');
        checkPaymentStatus(paymentId);
      }
    } catch (error) {
      cleanup();
      console.log('Onglet PayPal fermé (cross-origin)');
      checkPaymentStatus(paymentId);
    }
  }, 1000);

  window.addEventListener('message', messageHandler);

  try {
    tabWindow.focus();
  } catch (error) {
    console.log('Impossible de donner le focus à l\'onglet');
  }

  console.log('Onglet PayPal ouvert et surveillé');
};

const checkPaymentStatus = async (paymentId) => {
  try {
    console.log('Vérification du statut de paiement:', paymentId);
    const statusResponse = await paymentService.checkPaymentStatus(paymentId);
    console.log('Statut du paiement:', statusResponse);
    
    if (statusResponse.success) {
      if (statusResponse.status === 'approved' || statusResponse.status === 'completed') {
        onPaymentSuccess(paymentId);
      } else if (statusResponse.status === 'cancelled') {
        onPaymentCancelled();
      } else {
        console.log('Paiement en attente ou statut inconnu:', statusResponse.status);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
  }
};

const onPaymentSuccess = async (paymentId) => {
  try {
    console.log('Paiement réussi:', paymentId);
    
    const soldResponse = await postService.sold(
      selectedConversation.value.otherParticipant._id,
      selectedConversation.value.productId._id
    );
    
    if (soldResponse) {
      await messagingStore.sendMessage(
        selectedConversation.value._id,
        `✅ Paiement confirmé ! Transaction réussie pour "${selectedConversation.value.productId.title}".`
      );
      
      await messagingStore.fetchConversation(selectedConversation.value._id);
      
      alert('Paiement réussi ! Le produit a été marqué comme vendu.');
    } else {
      alert('Paiement réussi mais erreur lors de la mise à jour du produit. Contactez le support.');
    }
    
  } catch (error) {
    console.error('Erreur lors du traitement du succès:', error);
    alert('Paiement réussi mais erreur lors du traitement. Contactez le support.');
  }
};

const onPaymentCancelled = () => {
  console.log('Paiement annulé par l\'utilisateur');
  alert('Paiement annulé. Vous pouvez réessayer à tout moment.');
};

const archiveConversation = async (conversation) => {
  try {
    conversation.isArchived = !conversation.isArchived
    showConversationMenu.value = null
    showConversationOptions.value = false
    showSalesOptions.value = false
    showBuyOption.value = false
    showOfferOption.value = false

    await messagingStore.updateConversation(conversation._id || conversation.id, {
      isArchived: conversation.isArchived
    })

    if (conversation.isArchived && selectedConversation.value &&
        (selectedConversation.value._id === conversation._id || selectedConversation.value.id === conversation.id)) {
      selectedConversation.value = null
    }
  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error)
    conversation.isArchived = !conversation.isArchived
  }
}

const deleteConversation = async (conversation) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')){
    try {
      const response = await messagingStore.deleteConversation(conversation._id || conversation.id)
      console.log('Conversation supprimée:', response)
      const index = messagingStore.conversations.findIndex(c =>
        (c._id || c.id) === (conversation._id || conversation.id)
      )
      if (index !== -1) {
        messagingStore.conversations.splice(index, 1)
      }

      if (selectedConversation.value &&
          (selectedConversation.value._id === conversation._id || selectedConversation.value.id === conversation.id)) {
        selectedConversation.value = null
      }

      showConversationMenu.value = null
      showConversationOptions.value = false
      showSalesOptions.value = false
      showBuyOption.value = false
      showOfferOption.value = false

    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }


}

const closeModal = () => {
  showNewConversationModal.value = false
}
const closeInformation = () => {
  const rightSidebar = document.querySelector('.right-sidebar');
  if (rightSidebar) {
    rightSidebar.classList.remove('active');
  }
}

const onNewConversationCreated = (newConversation) => {
  messagingStore.conversations.unshift(newConversation)
  
  selectConversation(newConversation)
  
  closeModal()
}

const handleImageUpload = (event) => {
  for (let index = 0; index < event.target?.files?.length; index++) {
    const file = event.target?.files[index];
    if (file) {
      attachments.value.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          attachmentView.value.push(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }
};

const closePopupImgList = () => {
  openAttachment.value = false;
  openAttachmentView.value = [];
  openAttachmentIndex.value = 0;
}

const deleteAttachement = (index) => {
  attachments.value.splice(index, 1);
  attachmentView.value.splice(index, 1);
}

const openImgList = (attachments, index) => {
  console.log(attachments);
  for (let index = 0; index < attachments.length; index++) {
    const attachment = attachments[index];
    openAttachmentView.value[index] = domain_api + '/uploads/chat_attachments/' + attachment;
  }
  openAttachmentIndex.value = index;
  openAttachment.value = true;
}

const openImgListPreview = (attachments, index) => {
  for (let index = 0; index < attachments.length; index++) {
    const attachment = attachments[index];
    openAttachmentView.value[index] = attachment;
  }
  openAttachmentIndex.value = index;
  openAttachment.value = true;
}

const handleAttachment = () => {
  const fileInput = document.getElementById('imageUpload');
  fileInput.click();
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
  return selectedConversation.value?.productContext || selectedConversation.value?.productId
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
  const context = selectedConversation.value?.context || selectedConversation.value
  const status = context?.negotiation?.status
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

    const userResponse = await userService.getMyInformation()
    userInfo.value = userResponse.user || userResponse.profile
    

    await messagingStore.fetchConversations()

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
showConversationOptions.value =  false
showSalesOptions.value =  false
showBuyOption.value = false
showOfferOption.value = false

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
  color: var(--blue);
  background: #e7f3ff;
  border-bottom: 3px solid var(--blue);
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
  background: var(--danger-color);
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
  background: var(--blue);
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
  border-color: var(--blue);
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
  border-left: 4px solid var(--blue);
  padding-left: 12px;
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
  border-left: 4px solid var(--blue);
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
  background: var(--danger-color);
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
.btn_mobile{
  display: none;
}
.btn_computer{
  display: block;
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

.conversation-dropdown .dropdown-item:hover, .popup-content:hover {
  background: #f8f9fa;
}

.conversation-dropdown .dropdown-item.favorite {
  color: #ffc107;
}

.conversation-dropdown .dropdown-item.danger {
  color: var(--danger-color);
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
  height: 100%;
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
  background: var(--blue);
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
.chat-area.active{
  display: block;
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
.back-btn{
  display: none;
}
.chat-participant {
  display: flex;
  align-items: center;
  gap: 12px;
}

.userPicture {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid #e9ecef;
  overflow: hidden;
  position: relative;
  display: block;
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
  display: block;
}
.information{
  display: none;
}
.close-btn-information-mobile{
  display: none;
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
  color: var(--danger-color);
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

.grid-attachements {
    display: grid;
    gap: 4px;
    margin-bottom: 10px;
    width: 300px; 

    grid-template-columns: 1fr;

    &:has(.message-attachement:nth-child(2)) {
        grid-template-columns: 1fr 1fr;
    }

    &:has(.message-attachement:nth-child(3)) {
        grid-template-columns: 2fr 1fr;
        grid-template-rows: repeat(2, 1fr);
        height: 300px;

        .message-attachement:first-child {
            grid-column: 1;
            grid-row: 1 / span 2;
            height: 100%;
        }
    }

    &:has(.message-attachement:nth-child(4)) {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        width: 300px;
        height: 300px;
        
        .message-attachement:first-child {
            grid-column: auto;
            grid-row: auto;
            height: 100%;
        }
        
        .message-attachement {
            width: 100%;
            height: 100%;
        }
    }
}

.message-attachement {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    position: relative;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &.has-more::after {
        content: attr(data-count);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        font-weight: bold;
        border-radius: 8px;
        z-index: 2;
    }
}
.btn-delete-attachment{
  width: fit-content;
  background: var(--blue);
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  text-align: center;
  position: absolute;
  margin-top: -7px;
  z-index: 9;
  margin-left: 85px;
  cursor: pointer;
}
.btn-delete-attachment:hover {
  background: var(--primary-color);
}
.popup-content .close-btn{
  position: absolute;
  right: -5px;
  top: -5px;
  color: var(--primary-color);
  z-index: 9;
}
.popup-content .screen{
  height: 100%;
}
.other-message .message-bubble {
  background: white;
  border: 1px solid #e9ecef;
}

.own-message .message-bubble {
  background: linear-gradient(135deg, var(--blue), #0b5ed7);
  color: white;
  flex-direction: row-reverse;
  justify-content: end;
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
  position: relative;
}
.attachements-preview-area {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.attachment-preview {
  width: 100px; 
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.attachment-image {
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  display: block;
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
  background: var(--blue);
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

/* ============================================ */
/* EMOJI PICKER POPUP STYLES */
/* ============================================ */
.emoji-picker-popup {
  position: absolute;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
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
  border: 3px solid #e9ecef;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden; 
  position: relative;
  display: block;
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
.product-kpopMember{
  margin-bottom: 5px;
}

.product-info h4 {
  margin: 0 0 3px 0;
  color: #212529;
  font-size: 16px;
}

.product-description {
    color: #6c757d;
    font-size: 14px;
    margin-bottom: 16px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
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
.category-label{
  color: #819A57;
  border: 2px solid #819A57;
  border-radius: 10px;
  padding: 5px;
  font-size: xx-small;
  font-weight: bold;
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
  border-color: var(--blue);
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
  
  .emoji-picker-popup {
    right: 10px;
    bottom: 70px;
  }
}

@media (max-width: 1024px) {
  .right-sidebar {
    display: none;
  }
  .right-sidebar.active {
    display: block;
    z-index: 11;
    top: 0px;
    position: absolute;
    width: 100%;  
  }
}

@media (max-width: 768px) {

  .messaging-container {
    flex-direction: column;
    position: relative;
    z-index: 10;
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
  .grid-attachements{
    position: relative;
    max-width: 100%;
  }
  .modal {
    width: 95vw;
    margin: 20px;
  }

  .navigation-tabs {
    overflow-x: auto;
  }
  .btn_mobile{
    display: block;
  }
  .btn_computer{
    display: none;
  }
  .tab {
    min-width: 80px;
    flex-shrink: 0;
  }
  .information{
    display: flex;
  }
  .close-btn-information-mobile{
    display: block;
    background: none;
    border: none;
    margin-left: auto;
    font-size: larger;
  }
  .back-btn{
    display: block;
    font-size: xx-large;
    margin-right: 10px;
  }
  .chat-participant{
    margin-right: auto;
  }
  .no-conversation{
    height: 100%;
  }
  .chat-area.active{
    z-index: 11;
    position: absolute;
  }
  
  .emoji-picker-popup {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    right: auto;
    width: 90vw;
    max-width: 350px;
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
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

/* Text utilities */
.text-primary {
  color: var(--blue) !important;
}

.text-success {
  color: #28a745 !important;
}

.text-danger {
  color: var(--danger-color) !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-muted {
  color: #6c757d !important;
}

.media-section {
  padding: 24px;
  border-top: 1px solid #e9ecef;

  .section-title {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #212529;
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 150px);
    gap: 8px;
    max-width: 100%;
    
    .media-item {
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
      position: relative;
      
      &:hover {
        transform: scale(1.02);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .media-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        
        .media-count {
          color: white;
          font-size: 18px;
          font-weight: bold;
        }
      }

      &.media-1 {
        grid-column: 1;
        grid-row: 1;
      }

      &.media-2 {
        grid-column: 2;
        grid-row: 1;
      }

      &.media-3 {
        grid-column: 1;
        grid-row: 2;
      }

      &.media-4 {
        grid-column: 2;
        grid-row: 2;
      }
    }
  }
}

</style>
