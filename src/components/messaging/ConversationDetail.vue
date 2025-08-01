<template>
  <div class="conversation-detail">
    <!-- Header de la conversation -->
    <div class="conversation-header">
      <button @click="goBack" class="back-btn">
        <i class="bi bi-arrow-left"></i>
      </button>

      <div class="header-info">
        <div class="participant-info" v-if="conversation">
          <div
            v-if="otherParticipant"
            class="avatar"
            v-html="renderAvatar(otherParticipant)"
          ></div>
          <div>
            <h3>{{ conversationTitle }}</h3>
            <span class="status">{{ getStatusText() }}</span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button @click="toggleInfo" class="action-btn">
          <i class="bi bi-info-circle"></i>
        </button>
      </div>
    </div>

    <!-- Zone des messages -->
    <div class="messages-container" ref="messagesContainer" @scroll="handleScroll">
      <div v-if="loading && !messages.length" class="loading">
        <div class="spinner"></div>
        <p>Chargement des messages...</p>
      </div>

      <!-- Bouton pour charger plus de messages -->
      <div v-if="pagination.page < pagination.pages" class="load-more">
        <button @click="loadMoreMessages" :disabled="loadingMore">
          {{ loadingMore ? 'Chargement...' : 'Charger plus de messages' }}
        </button>
      </div>

      <!-- Messages -->
      <div
        v-for="(message, index) in messages"
        :key="message._id"
        :class="['message-wrapper', {
          'own-message': isOwnMessage(message),
          'system-message': message.contentType === 'system_notification'
        }]"
      >
        <!-- Séparateur de date si nécessaire -->
        <div
          v-if="shouldShowDateSeparator(message, index)"
          class="date-separator"
        >
          {{ formatDate(message.createdAt) }}
        </div>

        <!-- Message système -->
        <div v-if="message.contentType === 'system_notification'" class="system-notification">
          <i class="bi bi-info-circle"></i>
          {{ message.content }}
        </div>

        <!-- Message normal -->
        <div v-else class="message">
          <div class="message-content">
            <!-- Contenu spécial pour les offres -->
            <div v-if="['offer', 'counter_offer'].includes(message.contentType)" class="offer-content">
              <i class="bi bi-tag"></i>
              <strong>{{ message.content }}</strong>
            </div>

            <!-- Contenu texte normal -->
            <p v-else>{{ message.content }}</p>

            <!-- Pièces jointes -->
            <div v-if="message.attachments && message.attachments.length" class="attachments">
              <div
                v-for="attachment in message.attachments"
                :key="attachment"
                class="attachment"
                @click="viewAttachment(message._id, attachment)"
              >
                <i class="bi bi-paperclip"></i>
                {{ attachment }}
              </div>
            </div>
          </div>

          <div class="message-meta">
            <span class="time">{{ formatTime(message.createdAt) }}</span>
            <span v-if="isOwnMessage(message)" class="read-status">
              <i v-if="message.readBy.length > 1" class="bi bi-check-all"></i>
              <i v-else class="bi bi-check"></i>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Zone de négociation si applicable -->
    <div v-if="conversation?.type === 'negotiation' && negotiationActive" class="negotiation-zone">
      <div class="negotiation-info">
        <p>Prix initial: <strong>{{ conversation.negotiation?.initialPrice }} €</strong></p>
        <p>Offre actuelle: <strong>{{ conversation.negotiation?.currentOffer }} €</strong></p>
        <p v-if="conversation.negotiation?.counterOffer">
          Contre-offre: <strong>{{ conversation.negotiation.counterOffer }} €</strong>
        </p>
      </div>

      <div v-if="isProductOwner && conversation.negotiation?.status === 'pending'" class="negotiation-actions">
        <button @click="openNegotiationModal('accept')" class="btn-accept">
          <i class="bi bi-check-circle"></i> Accepter
        </button>
        <button @click="openNegotiationModal('counter')" class="btn-counter">
          <i class="bi bi-arrow-repeat"></i> Contre-offre
        </button>
        <button @click="openNegotiationModal('reject')" class="btn-reject">
          <i class="bi bi-x-circle"></i> Refuser
        </button>
      </div>
    </div>

    <!-- Zone Pay What You Want -->
    <div v-if="conversation?.type === 'pay_what_you_want' && conversation.payWhatYouWant" class="pwyw-zone">
      <div class="pwyw-info">
        <p>Prix minimum: <strong>{{ conversation.payWhatYouWant.minimumPrice }} €</strong></p>
        <p v-if="conversation.payWhatYouWant.maximumPrice">
          Prix maximum: <strong>{{ conversation.payWhatYouWant.maximumPrice }} €</strong>
        </p>
        <p v-if="conversation.payWhatYouWant.proposedPrice">
          Prix proposé: <strong>{{ conversation.payWhatYouWant.proposedPrice }} €</strong>
        </p>
      </div>

      <div v-if="!isProductOwner && !conversation.payWhatYouWant.proposedPrice" class="pwyw-actions">
        <button @click="openPwywModal" class="btn-propose">
          <i class="bi bi-tag"></i> Proposer un prix
        </button>
      </div>
    </div>

    <!-- Zone de saisie de message -->
    <div class="message-input-container">
      <div class="attachments-preview" v-if="selectedFiles.length">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="attachment-preview"
        >
          <span>{{ file.name }}</span>
          <button @click="removeFile(index)" class="remove-btn">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <form @submit.prevent="sendMessage" class="message-form">
        <button type="button" @click="triggerFileInput" class="attach-btn">
          <i class="bi bi-paperclip"></i>
        </button>

        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*,.pdf"
          @change="handleFileSelect"
          style="display: none"
        />

        <textarea
          v-model="newMessage"
          @keydown.enter.prevent="handleEnterKey"
          placeholder="Écrivez votre message..."
          rows="1"
          class="message-input"
        ></textarea>

        <button
          type="submit"
          :disabled="!canSendMessage"
          class="send-btn"
        >
          <i class="bi bi-send"></i>
        </button>
      </form>
    </div>

    <!-- Modal de négociation -->
    <div v-if="showNegotiationModal" class="modal-overlay" @click.self="closeNegotiationModal">
      <div class="modal">
        <h3>{{ getNegotiationModalTitle() }}</h3>

        <div v-if="negotiationAction === 'counter'" class="form-group">
          <label>Votre contre-offre :</label>
          <input
            v-model.number="counterOfferAmount"
            type="number"
            min="0"
            step="0.01"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label>Message (optionnel) :</label>
          <textarea
            v-model="negotiationMessage"
            rows="3"
            class="form-control"
          ></textarea>
        </div>

        <div class="modal-actions">
          <button @click="closeNegotiationModal" class="btn-cancel">Annuler</button>
          <button @click="submitNegotiationResponse" class="btn-confirm">
            {{ getConfirmButtonText() }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal PWYW -->
    <div v-if="showPwywModal" class="modal-overlay" @click.self="closePwywModal">
      <div class="modal">
        <h3>Proposer un prix</h3>

        <div class="form-group">
          <label>Votre prix :</label>
          <input
            v-model.number="pwywPrice"
            type="number"
            :min="conversation?.payWhatYouWant?.minimumPrice"
            :max="conversation?.payWhatYouWant?.maximumPrice"
            step="0.01"
            class="form-control"
          />
          <small class="form-hint">
            Entre {{ conversation?.payWhatYouWant?.minimumPrice }} €
            {{ conversation?.payWhatYouWant?.maximumPrice ? `et ${conversation.payWhatYouWant.maximumPrice} €` : '' }}
          </small>
        </div>

        <div class="form-group">
          <label>Message (optionnel) :</label>
          <textarea
            v-model="pwywMessage"
            rows="3"
            class="form-control"
          ></textarea>
        </div>

        <div class="modal-actions">
          <button @click="closePwywModal" class="btn-cancel">Annuler</button>
          <button @click="submitPwywOffer" class="btn-confirm">
            Proposer
          </button>
        </div>
      </div>
    </div>

    <!-- Panneau d'informations -->
    <div v-if="showInfoPanel" class="info-panel">
      <div class="info-header">
        <h3>Informations</h3>
        <button @click="toggleInfo" class="close-btn">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <div v-if="conversation?.productId" class="product-info">
        <h4>Produit</h4>
        <div class="product-card">
          <img
            v-if="conversation.productId.images?.[0]"
            :src="conversation.productId.images[0]"
            :alt="conversation.productId.title"
          />
          <div class="product-details">
            <p class="product-title">{{ conversation.productId.title }}</p>
            <p class="product-price">{{ conversation.productId.price }} €</p>
          </div>
        </div>
      </div>

      <div class="participants-info">
        <h4>Participants</h4>
        <div
          v-for="participant in conversation?.participants"
          :key="participant._id"
          class="participant"
        >
          <div class="avatar-small" v-html="renderAvatar(participant)"></div>
          <span>{{ participant.username }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import messagingService from '@/services/messaging.service';
import type { Conversation, Message, User } from '@/types/messaging.types';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default defineComponent({
  name: 'ConversationDetail',
  setup() {
    const route = useRoute();
    const router = useRouter();

    // Refs
    const conversation = ref<Conversation | null>(null);
    const messages = ref<Message[]>([]);
    const newMessage = ref('');
    const selectedFiles = ref<File[]>([]);
    const loading = ref(false);
    const loadingMore = ref(false);
    const showInfoPanel = ref(false);
    const showNegotiationModal = ref(false);
    const showPwywModal = ref(false);
    const negotiationAction = ref<'accept' | 'counter' | 'reject'>('accept');
    const negotiationMessage = ref('');
    const counterOfferAmount = ref(0);
    const pwywPrice = ref(0);
    const pwywMessage = ref('');

    // Refs DOM
    const messagesContainer = ref<HTMLElement>();
    const fileInput = ref<HTMLInputElement>();

    // Pagination
    const pagination = ref({
      total: 0,
      page: 1,
      limit: 20,
      pages: 1
    });

    // Computed
    const conversationId = computed(() => route.params.id as string);

    const currentUserId = computed(() => {
      return localStorage.getItem('userId') || '';
    });

    const otherParticipant = computed(() => {
      if (!conversation.value) return null;
      return conversation.value.participants.find(p => p._id !== currentUserId.value);
    });

    const conversationTitle = computed(() => {
      if (conversation.value?.title) return conversation.value.title;
      if (otherParticipant.value) return otherParticipant.value.username;
      return 'Conversation';
    });

    const isProductOwner = computed(() => {
      return conversation.value?.isOwner || false;
    });

    const negotiationActive = computed(() => {
      return conversation.value?.negotiation?.status === 'pending';
    });

    const canSendMessage = computed(() => {
      return newMessage.value.trim().length > 0 || selectedFiles.value.length > 0;
    });

    // Methods
    const loadConversation = async () => {
      loading.value = true;
      try {
        const response = await messagingService.getConversation(
          conversationId.value,
          { page: pagination.value.page }
        );
        conversation.value = response.conversation;
        messages.value = response.messages;
        pagination.value = response.pagination;

        // Marquer comme lu
        await messagingService.markConversationAsRead(conversationId.value);

        // Scroll vers le bas après chargement
        nextTick(() => {
          scrollToBottom();
        });
      } catch (error) {
        console.error('Erreur lors du chargement de la conversation:', error);
      } finally {
        loading.value = false;
      }
    };

    const loadMoreMessages = async () => {
      if (loadingMore.value || pagination.value.page >= pagination.value.pages) return;

      loadingMore.value = true;
      try {
        const response = await messagingService.getConversation(
          conversationId.value,
          { page: pagination.value.page + 1 }
        );
        messages.value = [...response.messages, ...messages.value];
        pagination.value = response.pagination;
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      } finally {
        loadingMore.value = false;
      }
    };

    const sendMessage = async () => {
      if (!canSendMessage.value) return;

      try {
        await messagingService.sendMessage(conversationId.value, {
          content: newMessage.value,
          attachments: selectedFiles.value
        });

        newMessage.value = '';
        selectedFiles.value = [];

        // Recharger les messages
        await loadConversation();
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    };

    const handleEnterKey = (event: KeyboardEvent) => {
      if (!event.shiftKey) {
        sendMessage();
      }
    };

    const handleFileSelect = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        selectedFiles.value = [...selectedFiles.value, ...Array.from(target.files)];
      }
    };

    const removeFile = (index: number) => {
      selectedFiles.value.splice(index, 1);
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const viewAttachment = (messageId: string, attachmentName: string) => {
      const url = messagingService.getAttachmentUrl(messageId, attachmentName);
      window.open(url, '_blank');
    };

    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    const handleScroll = () => {
      // Implémenter la détection du scroll pour charger plus de messages
      if (messagesContainer.value && messagesContainer.value.scrollTop === 0) {
        loadMoreMessages();
      }
    };

    const isOwnMessage = (message: Message): boolean => {
      if (typeof message.sender === 'string') {
        return message.sender === currentUserId.value;
      }
      return message.sender._id === currentUserId.value;
    };

    const shouldShowDateSeparator = (message: Message, index: number): boolean => {
      if (index === 0) return true;

      const currentDate = new Date(message.createdAt);
      const previousDate = new Date(messages.value[index - 1].createdAt);

      return currentDate.toDateString() !== previousDate.toDateString();
    };

    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      if (isToday(date)) return 'Aujourd\'hui';
      if (isYesterday(date)) return 'Hier';
      return format(date, 'EEEE d MMMM', { locale: fr });
    };

    const formatTime = (dateString: string): string => {
      return format(new Date(dateString), 'HH:mm');
    };

    const renderAvatar = (user: User): string => {
      if (user.profilePicture) {
        return `<img src="${user.profilePicture}" alt="${user.username}" />`;
      }
      const initials = user.username
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return `<div class="avatar-initials">${initials}</div>`;
    };

    const getStatusText = (): string => {
      if (conversation.value?.type === 'negotiation') {
        const status = conversation.value.negotiation?.status;
        switch (status) {
          case 'pending': return 'Négociation en cours';
          case 'accepted': return 'Offre acceptée';
          case 'rejected': return 'Offre refusée';
          default: return '';
        }
      }
      return 'En ligne';
    };

    const goBack = () => {
      router.back();
    };

    const toggleInfo = () => {
      showInfoPanel.value = !showInfoPanel.value;
    };

    // Négociation
    const openNegotiationModal = (action: 'accept' | 'counter' | 'reject') => {
      negotiationAction.value = action;
      showNegotiationModal.value = true;
      if (action === 'counter' && conversation.value?.negotiation) {
        counterOfferAmount.value = conversation.value.negotiation.currentOffer;
      }
    };

    const closeNegotiationModal = () => {
      showNegotiationModal.value = false;
      negotiationMessage.value = '';
      counterOfferAmount.value = 0;
    };

    const getNegotiationModalTitle = (): string => {
      switch (negotiationAction.value) {
        case 'accept': return 'Accepter l\'offre';
        case 'counter': return 'Faire une contre-offre';
        case 'reject': return 'Refuser l\'offre';
        default: return '';
      }
    };

    const getConfirmButtonText = (): string => {
      switch (negotiationAction.value) {
        case 'accept': return 'Accepter';
        case 'counter': return 'Envoyer la contre-offre';
        case 'reject': return 'Refuser';
        default: return '';
      }
    };

    const submitNegotiationResponse = async () => {
      try {
        await messagingService.respondToNegotiation(conversationId.value, {
          action: negotiationAction.value,
          counterOffer: negotiationAction.value === 'counter' ? counterOfferAmount.value : undefined,
          message: negotiationMessage.value
        });
        closeNegotiationModal();
        await loadConversation();
      } catch (error) {
        console.error('Erreur lors de la réponse à la négociation:', error);
      }
    };

    // PWYW
    const openPwywModal = () => {
      showPwywModal.value = true;
      if (conversation.value?.payWhatYouWant) {
        pwywPrice.value = conversation.value.payWhatYouWant.minimumPrice;
      }
    };

    const closePwywModal = () => {
      showPwywModal.value = false;
      pwywMessage.value = '';
      pwywPrice.value = 0;
    };

    const submitPwywOffer = async () => {
      try {
        await messagingService.makePayWhatYouWantOffer(conversationId.value, {
          proposedPrice: pwywPrice.value,
          message: pwywMessage.value
        });
        closePwywModal();
        await loadConversation();
      } catch (error) {
        console.error('Erreur lors de la proposition PWYW:', error);
      }
    };

    // Lifecycle
    onMounted(() => {
      loadConversation();

      // Polling pour les nouveaux messages
      const interval = setInterval(() => {
        loadConversation();
      }, 5000);

      onUnmounted(() => {
        clearInterval(interval);
      });
    });

    return {
      // State
      conversation,
      messages,
      newMessage,
      selectedFiles,
      loading,
      loadingMore,
      showInfoPanel,
      showNegotiationModal,
      showPwywModal,
      negotiationAction,
      negotiationMessage,
      counterOfferAmount,
      pwywPrice,
      pwywMessage,
      pagination,

      // Refs
      messagesContainer,
      fileInput,

      // Computed
      conversationTitle,
      otherParticipant,
      isProductOwner,
      negotiationActive,
      canSendMessage,

      // Methods
      sendMessage,
      handleEnterKey,
      handleFileSelect,
      removeFile,
      triggerFileInput,
      viewAttachment,
      loadMoreMessages,
      handleScroll,
      isOwnMessage,
      shouldShowDateSeparator,
      formatDate,
      formatTime,
      renderAvatar,
      getStatusText,
      goBack,
      toggleInfo,
      openNegotiationModal,
      closeNegotiationModal,
      getNegotiationModalTitle,
      getConfirmButtonText,
      submitNegotiationResponse,
      openPwywModal,
      closePwywModal,
      submitPwywOffer
    };
  }
});
</script>

<style lang="scss" scoped>
.conversation-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  position: relative;
}

// Header
.conversation-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  z-index: 10;

  .back-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
    margin-right: 15px;
    color: #666;

    &:hover {
      color: var(--primary-color);
    }
  }

  .header-info {
    flex: 1;

    .participant-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        background: #e0e0e0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
      }

      .status {
        font-size: 12px;
        color: #666;
      }
    }
  }

  .header-actions {
    .action-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 5px;
      color: #666;

      &:hover {
        color: var(--primary-color);
      }
    }
  }
}

// Messages container
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;

  .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  p {
    margin-top: 20px;
    color: #666;
  }
}

.load-more {
  text-align: center;
  margin-bottom: 20px;

  button {
    background: white;
    border: 1px solid #ddd;
    padding: 8px 20px;
    border-radius: 20px;
    cursor: pointer;
    color: var(--primary-color);

    &:hover:not(:disabled) {
      background: #f5f5f5;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.date-separator {
  text-align: center;
  margin: 20px 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: #ddd;
    z-index: 0;
  }

  span {
    background: #f5f5f5;
    padding: 0 15px;
    position: relative;
    z-index: 1;
    color: #666;
    font-size: 12px;
  }
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;

  &.own-message {
    justify-content: flex-end;

    .message {
      background: var(--primary-color);
      color: white;
      border-radius: 18px 18px 4px 18px;

      .message-meta {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  &.system-message {
    justify-content: center;
  }
}

.system-notification {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0f0f0;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  margin: 10px auto;

  i {
    font-size: 14px;
  }
}

.message {
  max-width: 70%;
  background: white;
  padding: 10px 16px;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);

  .message-content {
    p {
      margin: 0;
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .offer-content {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary-color);

      i {
        font-size: 16px;
      }
    }

    .attachments {
      margin-top: 8px;

      .attachment {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(0,0,0,0.05);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        margin-right: 4px;
        margin-bottom: 4px;

        &:hover {
          background: rgba(0,0,0,0.1);
        }

        i {
          font-size: 14px;
        }
      }
    }
  }

  .message-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 11px;
    color: #999;

    .read-status {
      i {
        font-size: 14px;
      }
    }
  }
}

// Zones spéciales
.negotiation-zone,
.pwyw-zone {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 15px 20px;

  .negotiation-info,
  .pwyw-info {
    margin-bottom: 15px;

    p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;

      strong {
        color: #333;
      }
    }
  }

  .negotiation-actions,
  .pwyw-actions {
    display: flex;
    gap: 10px;

    button {
      flex: 1;
      padding: 10px 16px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.3s;

      &.btn-accept {
        background: #28a745;
        color: white;

        &:hover {
          background: #218838;
        }
      }

      &.btn-counter {
        background: #ffc107;
        color: #333;

        &:hover {
          background: #e0a800;
        }
      }

      &.btn-reject {
        background: #dc3545;
        color: white;

        &:hover {
          background: #c82333;
        }
      }

      &.btn-propose {
        background: var(--primary-color);
        color: white;

        &:hover {
          opacity: 0.9;
        }
      }
    }
  }
}

// Message input
.message-input-container {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 15px 20px;

  .attachments-preview {
    margin-bottom: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .attachment-preview {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f0f0f0;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;

      .remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        padding: 0;
        display: flex;
        align-items: center;

        &:hover {
          color: #333;
        }
      }
    }
  }

  .message-form {
    display: flex;
    align-items: flex-end;
    gap: 10px;

    .attach-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 8px;

      &:hover {
        color: var(--primary-color);
      }
    }

    .message-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 20px;
      padding: 10px 16px;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      max-height: 120px;

      &:focus {
        border-color: var(--primary-color);
      }
    }

    .send-btn {
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;

      &:hover:not(:disabled) {
        transform: scale(1.1);
        //background: darken(var(--primary-color), 10%);
        background: rgba(var(--primary-color-rgb), 0.9);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      i {
        font-size: 18px;
      }
    }
  }
}

// Modals
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

  .modal {
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

    h3 {
      margin: 0 0 20px 0;
      font-size: 20px;
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
      }

      .form-control {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
        outline: none;
        font-family: inherit;

        &:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
        }
      }

      textarea.form-control {
        resize: vertical;
        min-height: 80px;
      }

      .form-hint {
        display: block;
        margin-top: 5px;
        font-size: 12px;
        color: #666;
      }
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 24px;

      button {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;

        &.btn-cancel {
          background: #f0f0f0;
          color: #333;

          &:hover {
            background: #e0e0e0;
          }
        }

        &.btn-confirm {
          background: var(--primary-color);
          color: white;

          &:hover {
            opacity: 0.9;
          }
        }
      }
    }
  }
}

// Info panel
.info-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  animation: slideIn 0.3s ease-out;

  .info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;

    h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 0;

      &:hover {
        color: #333;
      }
    }
  }

  .product-info,
  .participants-info {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;

    h4 {
      margin: 0 0 15px 0;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .product-card {
    display: flex;
    gap: 12px;
    align-items: center;
    background: #f5f5f5;
    padding: 12px;
    border-radius: 8px;

    img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

    .product-details {
      flex: 1;

      .product-title {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .product-price {
        margin: 0;
        font-size: 16px;
        font-weight: bold;
        color: var(--primary-color);
      }
    }
  }

  .participant {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;

    .avatar-small {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      background: #e0e0e0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-initials {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-color);
        color: white;
        font-weight: 500;
        font-size: 14px;
      }
    }

    span {
      font-size: 14px;
      color: #333;
    }
  }
}

// Animations
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

// Responsive
@media (max-width: 768px) {
  .conversation-header {
    padding: 12px 16px;

    .header-info {
      .participant-info {
        h3 {
          font-size: 16px;
        }
      }
    }
  }

  .messages-container {
    padding: 15px;
  }

  .message {
    max-width: 85%;
  }

  .message-input-container {
    padding: 12px 16px;
  }

  .info-panel {
    width: 100%;
  }

  .modal-overlay {
    .modal {
      margin: 20px;
      padding: 20px;

      h3 {
        font-size: 18px;
      }
    }
  }

  .negotiation-zone,
  .pwyw-zone {
    padding: 12px 16px;

    .negotiation-actions,
    .pwyw-actions {
      flex-direction: column;

      button {
        width: 100%;
      }
    }
  }
}

@media (max-width: 480px) {
  .message {
    max-width: 90%;
    font-size: 14px;
  }

  .conversation-header {
    .back-btn {
      margin-right: 10px;
    }
  }

  .date-separator {
    margin: 15px 0;
    font-size: 11px;
  }
}
</style>
