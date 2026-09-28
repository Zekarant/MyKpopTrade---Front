<template>
  <main class="page">
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
            <span class="status"><!--{{ userInfo?.status || 'Hors ligne' }}--> En ligne</span>
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
          <button class="btn-new-conversation" @click="openNewConversationModal" title="Créer une nouvelle conversation">
            <i class="bi bi-plus-circle"></i>
            <span class="btn-label">Nouveau</span>
          </button>
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
              favorite: isFavoriteConversation(conversation)
            }"
            @click="selectConversation(conversation)">

            <div>
              <div class="conversation-avatar" v-html="getAvatar(getOtherParticipant(conversation))"></div>
              <div class="online-indicator" v-if="getOtherParticipant(conversation)?.isOnline"></div>
            </div>
            <div class="conversation-content">
              <div class="conversation-header">
                <div class="conversation-title">
                  <span class="username">{{ getOtherParticipant(conversation)?.username || conversation.username }}</span>
                  <i class="bi bi-star-fill favorite-icon" v-if="isFavoriteConversation(conversation)"></i>
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
                <button @click="toggleFavorite(conversation)" class="dropdown-item" :class="{ favorite: isFavoriteConversation(conversation) }">
                  <i class="bi" :class="isFavoriteConversation(conversation) ? 'bi-star-fill' : 'bi-star'"></i>
                  {{ isFavoriteConversation(conversation) ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
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
                  {{ isArchived(conversation) ? 'Désarchiver' : 'Archiver' }}
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
                <i class="bi bi-star-fill favorite-icon" v-if="isFavoriteConversation(selectedConversation)"></i>
              </div>
              <span class="status" :class="{ online: selectedConversation.participants?.[0]?.isOnline }">
                <!--{{ selectedConversation.participants?.[0]?.isOnline ? 'En ligne' : 'Hors ligne' }}-->
              </span>
            </div>
          </div>
          <div class="chat-actions">
            <button v-if="selectedConversation.productId" class="action-btn btn_computer" @click="expandSalesOptions" @click.stop title="sold">
              <i class="bi bi-cash-coin"></i>
            </button>
            <button
              class="action-btn btn_computer"
              @click="toggleFavorite(selectedConversation)"
              :title="isFavoriteConversation(selectedConversation) ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            >
              <i class="bi" :class="isFavoriteConversation(selectedConversation) ? 'bi-star-fill' : 'bi-star'"></i>
            </button>
            <button class="action-btn btn_computer" @click="toggleReadStatus(selectedConversation)" :title="selectedConversation.unreadCount > 0 ? 'Marquer comme lu' : 'Marquer comme non lu'">
              <i class="bi" :class="selectedConversation.unreadCount > 0 ? 'bi-check2-all' : 'bi-check2'"></i>
            </button>
            <button class="action-btn" @click="expandOptions" @click.stop title="Options">
              <i class="bi bi-three-dots"></i>
            </button>
              <!-- Dropdown Options de vente -->
              <div class="dropdown-menu" v-if="showSalesOptions" @click.stop>
                <button v-if="selectedConversation.productId" @click="sendOfferOption" class="dropdown-item">
                  <i class="bi bi-wallet"></i>
                  Faire une offre
                </button>
                <button v-if="selectedConversation.productId && !selectedConversation.isOwner" @click="buyOption" class="dropdown-item">
                  <i class="bi bi-credit-card"></i>
                  Acheter
                </button>
              </div>

            <!-- Dropdown Options -->
            <div class="dropdown-menu" v-if="showConversationOptions" @click.stop>
              <button @click="archiveConversation(selectedConversation)" class="dropdown-item">
                <i class="bi bi-archive"></i>
                {{ isArchived(selectedConversation)? 'Désarchiver' : 'Archiver' }}
              </button>
              <button @click="showRightBar" class="dropdown-item information">
                <i class="bi bi-info-circle"></i>
                Information
              </button>
              <button v-if="selectedConversation.productId" @click="sendOfferOption" class="dropdown-item btn_mobile">
                <i class="bi bi-wallet"></i>
                Faire une offre
              </button>
              <button v-if="selectedConversation.productId && !selectedConversation.isOwner"  @click="buyOption" class="dropdown-item btn_mobile">
                <i class="bi bi-credit-card"></i>
                Acheter
              </button>
              <button class="dropdown-item btn_mobile" @click="toggleFavorite(selectedConversation)" :title="isFavoriteConversation(selectedConversation) ? 'Retirer des favoris' : 'Ajouter aux favoris'">
                <i class="bi" :class="isFavoriteConversation(selectedConversation) ? 'bi-star-fill' : 'bi-star'"></i>
                <span style="display: inline-block;" v-if="isFavoriteConversation(selectedConversation)">Retirer</span>
                <span style="display: inline-block;" v-if="!isFavoriteConversation(selectedConversation)">Ajouter</span>
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
          <div v-if="loadingMoreMessages" class="loading-more-messages">
            <i class="bi bi-arrow-clockwise"></i>
            <span>Chargement...</span>
          </div>
          <div
            v-for="message in currentMessages"
            :key="message._id || message.id"
            class="message"
            :class="{ 'own-message': isOwnMessage(message), 'other-message': !isOwnMessage(message) }"
          >
            <div v-if="!isOwnMessage(message)">
              <div class="message-avatar" v-html="getAvatar(message.sender)"></div>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div v-if="message.attachments.length > 0" class="grid-attachements">
                  <div
                    class="message-attachement"
                    v-for="(attachement, index) in message.attachments.slice(0, 4)"
                    :key="index"
                    :class="{ 'has-more': index === 3 && message.attachments.length > 4 }"
                    :data-count="index === 3 && message.attachments.length > 4 ? `+${message.attachments.length - 4}` : ''" @click="openImgList(messageAttachmentUrls(message), index)">
                    <img :src="attachmentUrl(message._id || message.id, attachement)">
                  </div>
                </div>
                <p>{{ message.content }}</p>
                <div v-if="message.contentType === 'offer'" class="offer-actions">
                  <!-- Si c'est l'utilisateur actuel qui a envoyé l'offre -->
                  <div class="btn-offer" v-if="isOwnMessage(message)">
                    <!-- Afficher le statut de l'offre -->
                    <div v-if="getOfferStatus(message)" class="offer-status">
                      <span v-if="getOfferStatus(message) === 'accepted'" class="status-accepted">
                        <i class="bi bi-check-circle-fill"></i> Acceptée
                      </span>
                      <span v-else-if="getOfferStatus(message) === 'rejected'" class="status-rejected">
                        <i class="bi bi-x-circle-fill"></i> Refusée
                      </span>
                      <span v-else-if="getOfferStatus(message) === 'expired'"  class="status-rejected">
                        <i class="bi bi-x-lg"></i> Expirée
                      </span>
                      <span v-else class="status-pending">
                        <i class="bi bi-clock"></i> En attente
                      </span>
                    </div>
                    <div class="cancel-offer" @click="cancelOffer(message)" v-if="getOfferStatus(message) === 'pending'">
                      Annuler
                    </div>
                  </div>
                  <!-- Si c'est l'autre utilisateur qui a reçu l'offre -->
                  <div class="btns-offers" v-else>
                    <!-- Vérifier si l'offre est déjà acceptée ou refusée -->
                    <div v-if="getOfferStatus(message)" class="offer-status">
                      <span v-if="getOfferStatus(message) === 'accepted'" class="status-accepted">
                        <i class="bi bi-check-circle-fill"></i> Vous avez accepté
                      </span>
                      <span v-else-if="getOfferStatus(message) === 'rejected'" class="status-rejected">
                        <i class="bi bi-x-circle-fill"></i> Vous avez refusé
                      </span>
                      <div v-else-if="getOfferStatus(message) === 'pending'" style="display: flex;">
                        <button class="btn-outline btn-offer" @click="declineOffer_popup = true">
                          <i class="bi bi-x-circle"></i>
                          Refuser
                        </button>
                        <button class="btn-success btn-offer" @click="acceptOffer(message)">
                          <i class="bi bi-check-circle"></i>
                          Accepter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
              <!--{{ selectedConversation.otherParticipant?.isOnline ? 'En ligne' : 'Hors ligne' }}-->
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
            @click="openImgList(conversationMediaUrls(selectedConversation), index)"

          >
            <img :src="attachmentUrl(media.messageId, media.filename)" alt="Media">
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
    <CheckoutDialog
      v-if="showBuyOption && selectedConversation && selectedConversation.productId"
      :product-id="selectedConversation.productId._id"
      :product-title="selectedConversation.productId.title"
      :product-price="checkoutProductPrice"
      :currency="selectedConversation.productId.currency || 'EUR'"
      :shipping-options="selectedConversation.productId.shippingOptions || {}"
      @confirm="onCheckoutConfirmed"
      @cancel="showBuyOption = false"
    />

    <!--Faire offre Modal -->
    <div v-if="showOfferOption && selectedConversation.productId">
      <send_offer @offerSent="handleOfferSent"   @close="showOfferOption = false" :conversation="selectedConversation"></send_offer>
    </div>

    <div v-if="showCounterOfferOption" class="counter-popup-overlay" @click.self="closeCounterOfferPopup">
      <div class="counter-popup-content">
        <button class="counter-close-btn" @click="closeCounterOfferPopup">
          <i class="bi bi-x-lg"></i>
        </button>
        <h3 class="counter-popup-title">Faire une contre-offre</h3>
        <p class="counter-popup-message">Souhaitez-vous proposer une contre-offre ?</p>
        <input
          v-model.number="counterOfferAmount"
          type="number"
          min="0"
          step="0.01"
          placeholder="Entrez votre montant"
          class="counter-input"
        />
        <textarea
          v-model="counterOfferMessage"
          placeholder="Message optionnel"
          class="counter-input"
          style="min-height:60px;resize:vertical;margin-top:8px;"
        ></textarea>
        <div class="counter-popup-actions">
          <button class="btn-outline btn-wide" @click="closeCounterOfferPopup">Annuler</button>
          <button class="btn-danger btn-wide" @click="confirmCounterOffer" :disabled="!counterOfferAmount || sending">
            <span v-if="sending">Envoi...</span>
            <span v-else>Envoyer</span>
          </button>
        </div>
        <div v-if="errorMessageCounterOffer" style="color:#eb5252;padding:8px 0 0 0;text-align:center;font-size:14px;">
          {{ errorMessageCounterOffer }}
        </div>
      </div>
    </div>

    <div v-if="declineOffer_popup" class="popup-overlay">
      <div class="popup-content">
        <h3 class="popup-title">Refuser l'offre</h3>
        <p class="popup-message">Êtes-vous sûr de vouloir refuser cette offre ?</p>
        <textarea
          v-model="declineMessage"
          class="popup-textarea"
          placeholder="Ajouter un message (optionnel)">
        </textarea>
        <div class="popup-actions">
          <button class="btn-outline" @click="declineOffer_popup = false">Annuler</button>
          <button class="btn-danger" @click="declineOffer(selectedConversation, declineMessage)">Refuser</button>
        </div>
      </div>
    </div>
  </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import { useMessagingStore } from '@/store/messaging.store'
import userService from '@/services/user.service'
import paymentService from '@/services/payment.service'
import nav_bar from '@/components/adherents/nav_bar.vue';
import ImageCarousel from '@/components/ImageCarousel.vue';
import send_message from '@/components/adherents/send_message.vue';
import send_offer from '@/components/send_offer.vue';
import CheckoutDialog from '@/components/checkout/CheckoutDialog.vue';
import EmojiPicker from 'vue3-emoji-picker'
import Cookies from 'js-cookie';
import 'vue3-emoji-picker/css'
import messagingService from '@/services/messaging.service';
import { API_URL } from '@/config/api';
import {
  conversationTypeLabel,
  countConversationsByTab,
  filterConversations,
  findOfferStatus,
  formatLongDate,
  formatMessageTimestamp,
  getOtherParticipant as getOtherParticipantFor,
  isArchivedConversation,
  isFavoriteConversation as isFavoriteConversationFor,
  isOwnMessage as isOwnMessageFor,
  messageStatusIcon,
  transactionActions,
  transactionStatus,
  transactionStatusLabel,
  transactionTitle
} from './conversationHelpers';

// Store
const messagingStore = useMessagingStore()
const route = useRoute()

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
const showCounterOfferOption = ref(false)
const showConversationMenu = ref(null)
const showEmojiPicker = ref(false)
const userInfo = ref(null)
const loading = ref(false)
const sending = ref(false)
const domain_api = API_URL;
const declineOffer_popup = ref(false);
const counterOfferAmount = ref(null);
const counterOfferMessage = ref('');
const errorMessageCounterOffer = ref('');
const messagePagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 1,
  hasMore: true
});
const loadingMoreMessages = ref(false);

const { proxy } = getCurrentInstance()

// Utilisateur courant : un seul endroit. Le code lisait auparavant trois sources
// différentes, dont la clé inexistante « iduser ».
const currentUserId = () => Cookies.get('id_user') || userInfo.value?.id || userInfo.value?._id || null

// Computed — logique pure et testée dans conversationHelpers.ts
const filteredConversations = computed(() =>
  filterConversations(messagingStore.sortedConversations || [], {
    tab: activeTab.value,
    query: searchQuery.value,
    userId: currentUserId()
  })
)
const tabCounts = computed(() => countConversationsByTab(messagingStore.conversations || [], currentUserId()))

const isFavoriteConversation = (conversation) => isFavoriteConversationFor(conversation, currentUserId())
const isArchived = (conversation) => isArchivedConversation(conversation, currentUserId())

// Tab counts
const getAllConversationsCount = () => tabCounts.value.all
const getFavoritesCount = () => tabCounts.value.favorites
const getUnreadConversationsCount = () => tabCounts.value.unread
const getArchivedCount = () => tabCounts.value.archived

const getOtherParticipant = (conversation) => getOtherParticipantFor(conversation, currentUserId())

// Methods
const isOwnMessage = (message) => isOwnMessageFor(message, currentUserId())

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
  selectedConversation.value = conversation
  showConversationOptions.value = false
  showConversationMenu.value = null

  try {
    loading.value = true
    messagePagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      pages: 1,
      hasMore: true
    };

    if (conversation.unreadCount > 0) {
      await messagingStore.markAsRead(conversation._id || conversation.id)
    }

    // Fetch conversation details and messages
    const response = await messagingStore.fetchConversation(conversation._id || conversation.id)
    selectedConversation.value = response.conversation
    selectedConversation.value.otherParticipant = conversation.otherParticipant

    selectedConversation.value.media = response.media || []

    currentMessages.value = response.messages || conversation.messages || []
    if (response.pagination) {
      messagePagination.value = {
        ...response.pagination,
        hasMore: response.pagination.page < response.pagination.pages
      };
    }
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
const loadMoreMessages = async () => {
  if (!selectedConversation.value || loadingMoreMessages.value || !messagePagination.value.hasMore) {
    return;
  }

  try {
    loadingMoreMessages.value = true;
    const nextPage = messagePagination.value.page + 1;

    const response = await messagingStore.fetchConversation(
      selectedConversation.value.id || selectedConversation.value._id,
      {
        page: nextPage,
        limit: messagePagination.value.limit
      }
    );

    if (response.messages && response.messages.length > 0) {
      currentMessages.value = [...response.messages, ...currentMessages.value];

      if (response.pagination) {
        messagePagination.value = {
          ...response.pagination,
          hasMore: response.pagination.page < response.pagination.pages
        };
      }

      await nextTick();
      const container = document.querySelector('.messages-area');
      if (container) {
        const previousScrollHeight = container.scrollHeight;
        await nextTick();
        container.scrollTop = container.scrollHeight - previousScrollHeight;
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des messages', error);
  } finally {
    loadingMoreMessages.value = false;
  }
};
const handleMessagesScroll = (event) => {
  const container = event.target;
  // Si on est proche du haut (50px), charger plus de messages
  if (container.scrollTop < 50 && messagePagination.value.hasMore && !loadingMoreMessages.value) {
    loadMoreMessages();
  }
};

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
    showConversationMenu.value = null;

    await messagingStore.favorite(conversation._id || conversation.id);

    // Mettre à jour localement
    if (!conversation.favoritedBy) {
      conversation.favoritedBy = [];
    }

    await messagingStore.fetchConversations();
    selectConversation(selectedConversation.value);

  } catch (error) {
    console.error('Erreur lors de la mise à jour des favoris:', error);
  }
}
const closeCounterOfferPopup = () => {
  showCounterOfferOption.value = false;
  counterOfferAmount.value = null;
  counterOfferMessage.value = '';
  errorMessageCounterOffer.value = '';
}

const confirmCounterOffer = async () => {
  if (!counterOfferAmount.value || counterOfferAmount.value <= 0) {
    errorMessageCounterOffer.value = "Montant requis et doit être supérieur à 0.";
    return;
  }
  errorMessageCounterOffer.value = '';
  sending.value = true;
  try {
    if (!selectedConversation.value || !selectedConversation.value._id) {
      errorMessageCounterOffer.value = "Conversation invalide.";
      sending.value = false;
      return;
    }
    await messagingStore.sendCounterOffer(
      selectedConversation.value._id,
      counterOfferAmount.value,
      counterOfferMessage.value
    );
    closeCounterOfferPopup();

    // Recharge la conversation pour rafraîchir messages et statut
    await messagingStore.fetchConversation(selectedConversation.value._id);

  } catch (error) {
    errorMessageCounterOffer.value = "Erreur lors de l'envoi de la contre-offre.";
    console.error(error);
  } finally {
    sending.value = false;
  }
}

const handleOfferSent = async (offerInfo) => {
  showOfferOption.value = false

  const offerData = {
    productId: offerInfo.offerData.productId,
    initialOffer: offerInfo.amount,
    message:  offerInfo.message
  };
  messagingService.initiateNegotiation(
    offerData
  ).then(response => {
    selectedConversation.value = response.conversation;
    currentMessages.value.push(response.conversation.lastMessage)
    scrollToBottom()
  }).catch(error => {
    proxy.$func.showToastError(error.message || 'Erreur lors de l\'envoi de l\'offre.');

  })
  await sendMessage()
}
const acceptOffer = async (message) => {
  try {
    const response = await messagingStore.respondToNegotiation(
      message.conversation || message.id,
      'accept'
    )
    proxy.$func.showToastSuccess('Offre acceptée avec succès.');
    selectConversation(response.conversation);

  } catch (error) {
    proxy.$func.showToastError('Erreur lors de l\'acceptation de l\'offre.');
    console.error('Erreur lors de l\'acceptation de l\'offre:', error)
  }
}
const declineOffer = async (message, text) => {
  try {
    const response = await messagingStore.respondToNegotiation(
      message._id || message.id,
      'reject',
      text
    )
    declineOffer_popup.value = false;
    selectConversation(response.conversation);

  } catch (error) {
    console.error('Erreur lors du refus de l\'offre:', error)
  }
}

const getOfferStatus = (message) => findOfferStatus(selectedConversation.value, message)

const cancelOffer = async (message) => {
  try {
    const response = await messagingStore.cancelNegotiation(
      selectedConversation.value.negotiation.initialPrice,
      selectedConversation.value.productId._id,
      selectedConversation.value._id,
      message._id || message.id
    )
    proxy.$func.showToastSuccess('Offre annulée avec succès.');
    selectConversation(selectedConversation.value);

  } catch (error) {
    proxy.$func.showToastError('Erreur lors de l\'annulation de l\'offre.');
    console.error('Erreur lors de l\'annulation de l\'offre:', error)
  }
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
  if(selectedConversation.value.isOwner){
    showCounterOfferOption.value = !showCounterOfferOption.value

  }else{
    showOfferOption.value = !showOfferOption.value
  }
}
const checkoutProductPrice = computed(() => {
  const conv = selectedConversation.value;
  if (!conv) return 0;
  const accepted = conv.negotiation?.status === 'accepted'
    ? conv.negotiation.currentOffer
    : null;
  return accepted ?? conv.productId?.price ?? 0;
});

const onCheckoutConfirmed = (result) => {
  showBuyOption.value = false;

  // L'URL d'approbation vient de PayPal via l'API : elle pointe donc toujours
  // vers le bon environnement. Ne jamais la reconstruire en dur côté client.
  const approvalUrl = result?.payment?.approvalUrl ?? null;

  if (!result?.success || !approvalUrl) {
    if (result?.payment?.paypalOrderId) {
      paymentService.cancelPayPal(result.payment.paypalOrderId).catch(() => {});
    }
    proxy.$func.showToastError('Erreur lors de l\'initialisation du paiement. Veuillez réessayer.');
    return;
  }

  // Redirection complète vers PayPal — l'acheteur approuve puis revient sur /payment/success
  window.location.href = approvalUrl;
};

const archiveConversation = async (conversation) => {
  if(isArchived(conversation) == false){
    if (confirm('Êtes-vous sûr de vouloir archiver cette conversation ?')){
      try {
        const response = await messagingStore.archiveConversation(conversation._id || conversation.id)

        if (selectedConversation.value &&
            (selectedConversation.value._id === conversation._id || selectedConversation.value.id === conversation.id)) {
          selectedConversation.value = null
        }

        showConversationMenu.value = null
        showConversationOptions.value = false
        showSalesOptions.value = false
        showBuyOption.value = false
        showOfferOption.value = false
        await messagingStore.fetchConversations();

      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }else{
    if (confirm('Êtes-vous sûr de vouloir de désarchiver cette conversation ?')){
    try {
      const response = await messagingStore.unarchiveConversation(conversation._id || conversation.id)

      if (selectedConversation.value &&
          (selectedConversation.value._id === conversation._id || selectedConversation.value.id === conversation.id)) {
        selectedConversation.value = null
      }

      showConversationMenu.value = null
      showConversationOptions.value = false
      showSalesOptions.value = false
      showBuyOption.value = false
      showOfferOption.value = false
      await messagingStore.fetchConversations();

    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  }
}

const deleteConversation = async (conversation) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')){
    try {
      const response = await messagingStore.deleteConversation(conversation._id || conversation.id)
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

const openNewConversationModal = () => {
  showNewConversationModal.value = true
}

const closeInformation = () => {
  const rightSidebar = document.querySelector('.right-sidebar');
  if (rightSidebar) {
    rightSidebar.classList.remove('active');
  }
}

const onNewConversationCreated = (newConversation) => {
  const newConvId = newConversation.id || newConversation._id;

  // Vérifier si la conversation existe déjà par son ID
  const existingById = messagingStore.conversations.find((conv) => {
    const convId = conv.id || conv._id;
    return convId === newConvId;
  });

  if (existingById) {
    // La conversation existe déjà par ID, on la sélectionne
    selectConversation(existingById);
    closeModal();
    return;
  }

  // Vérifier s'il existe déjà une conversation avec le même utilisateur et le même produit
  const otherParticipant = getOtherParticipant(newConversation);
  const newProductId = newConversation.productId?._id || newConversation.productId;

  const existingConversation = messagingStore.conversations.find((conv) => {
    const convOtherParticipant = getOtherParticipant(conv);
    const convProductId = conv.productId?._id || conv.productId;

    // Même utilisateur
    const sameUser = convOtherParticipant?.id === otherParticipant?.id ||
                     convOtherParticipant?._id === otherParticipant?._id;

    // Même produit (ou tous deux sans produit)
    const sameProduct = (!convProductId && !newProductId) ||
                        (convProductId === newProductId);

    return sameUser && sameProduct;
  });

  if (existingConversation) {
    // Une conversation similaire existe déjà, on la sélectionne
    selectConversation(existingConversation);
  } else {
    // Ajouter la nouvelle conversation en début de liste
    messagingStore.conversations.unshift(newConversation);
    selectConversation(newConversation);
  }

  closeModal();
};


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

/**
 * URL d'une pièce jointe, via la route authentifiée qui vérifie l'appartenance
 * à la conversation.
 *
 * Ces images étaient auparavant chargées depuis /uploads/chat_attachments/,
 * servi en statique sans authentification : n'importe qui connaissant le nom du
 * fichier pouvait lire une pièce jointe de conversation privée.
 */
const attachmentUrl = (messageId, attachmentName) => {
  if (!messageId || !attachmentName) return '';
  return messagingService.getAttachmentUrl(String(messageId), String(attachmentName));
};

/** URLs des pièces jointes d'un message, dans l'ordre d'affichage. */
const messageAttachmentUrls = (message) => {
  const messageId = message?._id || message?.id;
  return (message?.attachments || []).map((name) => attachmentUrl(messageId, name));
};

/** URLs des médias d'une conversation ; chaque média porte son propre messageId. */
const conversationMediaUrls = (conversation) =>
  (conversation?.media || []).map((item) => attachmentUrl(item.messageId, item.filename));

const openImgList = (urls, index) => {
  openAttachmentView.value = [...urls];
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

// Utility methods — logique pure et testée dans conversationHelpers.ts
const formatTimestamp = (timestamp) => formatMessageTimestamp(timestamp)
const formatDate = (date) => formatLongDate(date)
const getConversationTypeLabel = (type) => conversationTypeLabel(type)
const getMessageStatusIcon = (message) => messageStatusIcon(message)

const getProductContext = () => {
  return selectedConversation.value?.productContext || selectedConversation.value?.productId
}

const getTransactionTitle = () => transactionTitle(selectedConversation.value)
const getTransactionStatus = () => transactionStatus(selectedConversation.value)
const getTransactionStatusLabel = () => transactionStatusLabel(selectedConversation.value)
const showTransactionActions = () => transactionActions(selectedConversation.value).visible
const canCancelTransaction = () => transactionActions(selectedConversation.value).canCancel
const canConfirmReceived = () => transactionActions(selectedConversation.value).canConfirmReceived
const canMarkAsSent = () => transactionActions(selectedConversation.value).canMarkAsSent

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
      // /adherents/messages/:id (ex. après une négociation) ouvre cette
      // conversation ; sinon, la plus récente comme avant.
      const requestedId = route.params.id
      const requested = requestedId
        ? messagingStore.conversations.find((c) => (c._id || c.id) === requestedId)
        : null
      await selectConversation(requested || messagingStore.conversations[0])
    }
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
      messagesArea.addEventListener('scroll', handleMessagesScroll);
    }
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
  } finally {
    loading.value = false
  }
})

// Close dropdowns when clicking outside
const closeDropdowns = () => {
showConversationOptions.value =  false
showSalesOptions.value =  false
showBuyOption.value = false
showOfferOption.value = false

showConversationMenu.value = null
  showEmojiPicker.value = false
}
document.addEventListener('click', closeDropdowns)
// Sans ce retrait, chaque visite de la messagerie ajoutait un écouteur global
// qui gardait en mémoire l'ancienne instance du composant.
onBeforeUnmount(() => document.removeEventListener('click', closeDropdowns))
</script>


<style lang="scss" scoped>
@use '../../css/messaging/messages_view.scss';
</style>

