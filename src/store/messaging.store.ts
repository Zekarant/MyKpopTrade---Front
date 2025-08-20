// stores/messaging.store.ts
import { defineStore } from 'pinia';
import messagingService from '@/services/messaging.service';
import type { Conversation, Message } from '@/types/messaging.types';

interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const useMessagingStore = defineStore('messaging', {
  state: (): MessagingState => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    unreadCount: 0,
    loading: false,
    error: null
  }),

  getters: {
    getConversationById: (state) => (id: string) => {
      return state.conversations.find(c => c._id === id);
    },

    hasUnreadMessages: (state) => {
      return state.unreadCount > 0;
    },

    sortedConversations: (state) => {
      return [...state.conversations].sort((a, b) => {
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
    }
  },

  actions: {
    async fetchConversations(params?: { page?: number; limit?: number; filter?: 'all' | 'unread' | 'active' }) {
      this.loading = true;
      this.error = null;
      try {
        const response = await messagingService.getUserConversations(params);
        this.conversations = response.conversations;
        this.updateUnreadCount();
        return response;
      } catch (error) {
        this.error = 'Erreur lors du chargement des conversations';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchConversation(conversationId: string, params?: { page?: number; limit?: number }) {
      this.loading = true;
      this.error = null;

      try {
        const response = await messagingService.getConversation(conversationId, params);
        this.currentConversation = response.conversation;
        this.messages = response.messages;

        // Mettre à jour la conversation dans la liste
        const index = this.conversations.findIndex(c => c._id === conversationId);
        if (index !== -1) {
          this.conversations[index].unreadCount = response.conversation.unreadCount || 0;
          if(this.conversations[index].participants.length > 0) {
            for (let index = 0; index < this.conversations[index].participants.length; index++) {
              const participant = this.conversations[index].participants[index];
              if(participant._id != localStorage.getItem('userId')) {
                if(!this.conversations[index].otherParticipant){
                  this.conversations[index].otherParticipant = participant;
                }
           
                
                
              }
              
            }
          }
        }

        return response;
      } catch (error) {
        this.error = 'Erreur lors du chargement de la conversation';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async sendMessage(conversationId: string, content: string, attachments?: File[]) {
      try {
        const response = await messagingService.sendMessage(conversationId, {
          content,
          attachments
        });

        // Ajouter le message à la liste
        this.messages.push(response.data);

        // Mettre à jour la conversation
        await this.fetchConversation(conversationId);

        return response;
      } catch (error) {
        this.error = 'Erreur lors de l\'envoi du message';
        console.error(error);
        throw error;
      }
    },

    async markAsRead(conversationId: string) {
      try {
        await messagingService.markConversationAsRead(conversationId);

        // Mettre à jour le compteur de non-lus
        const conversation = this.conversations.find(c => c._id === conversationId);
        if (conversation) {
          conversation.unreadCount = 0;
          this.updateUnreadCount();
        }
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
      }
    },

    async deleteMessage(messageId: string) {
      try {
        await messagingService.deleteMessage(messageId);

        // Retirer le message de la liste
        const index = this.messages.findIndex(m => m._id === messageId);
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
      } catch (error) {
        this.error = 'Erreur lors de la suppression du message';
        console.error(error);
        throw error;
      }
    },

    async startConversation(recipientId: string, productId?: string, initialMessage?: string) {
      try {
        const response = await messagingService.startConversation({
          recipientId,
          productId,
          initialMessage
        });

        // Ajouter la nouvelle conversation à la liste
        this.conversations.unshift(response.conversation);

        return response;
      } catch (error) {
        this.error = 'Erreur lors de la création de la conversation';
        console.error(error);
        throw error;
      }
    },

    async initiateNegotiation(productId: string, initialOffer: number, message?: string) {
      try {
        const response = await messagingService.initiateNegotiation({
          productId,
          initialOffer,
          message
        });

        // Ajouter ou mettre à jour la conversation
        const index = this.conversations.findIndex(c => c._id === response.conversation._id);
        if (index === -1) {
          this.conversations.unshift(response.conversation);
        } else {
          this.conversations[index] = response.conversation;
        }

        return response;
      } catch (error) {
        this.error = 'Erreur lors de l\'initiation de la négociation';
        console.error(error);
        throw error;
      }
    },

    async respondToNegotiation(
      conversationId: string,
      action: 'accept' | 'reject' | 'counter',
      counterOffer?: number,
      message?: string
    ) {
      try {
        const response = await messagingService.respondToNegotiation(conversationId, {
          action,
          counterOffer,
          message
        });

        // Mettre à jour la conversation
        await this.fetchConversation(conversationId);

        return response;
      } catch (error) {
        this.error = 'Erreur lors de la réponse à la négociation';
        console.error(error);
        throw error;
      }
    },

    updateUnreadCount() {
      this.unreadCount = this.conversations.reduce((sum, conv) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
    },

    clearCurrentConversation() {
      this.currentConversation = null;
      this.messages = [];
    },

    // WebSocket handlers pour les mises à jour en temps réel
    handleNewMessage(message: Message) {
      // Si le message appartient à la conversation actuelle
      if (this.currentConversation && message.conversation === this.currentConversation._id) {
        this.messages.push(message);
      }

      // Mettre à jour la conversation dans la liste
      const conversation = this.conversations.find(c => c._id === message.conversation);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.lastMessageAt = message.createdAt;

        // Incrémenter le compteur de non-lus si ce n'est pas notre message
        const currentUserId = localStorage.getItem('userId');
        if (message.sender !== currentUserId && !message.readBy.includes(currentUserId || '')) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          this.updateUnreadCount();
        }
      }
    },

    handleMessageRead(data: { conversationId: string; userId: string; messageIds: string[] }) {
      // Mettre à jour le statut de lecture des messages
      this.messages.forEach(message => {
        if (data.messageIds.includes(message._id) && !message.readBy.includes(data.userId)) {
          message.readBy.push(data.userId);
        }
      });
    },

    updateConversation(conversationId: string, data:{ isFavorite: boolean , isArchived:boolean} ) {
    }
  }
});
