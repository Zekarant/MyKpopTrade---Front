// stores/messaging.store.ts
import { defineStore } from 'pinia';
import messagingService from '@/services/messaging.service';
import type { Conversation, Message, NegotiationRequest } from '@/types/messaging.types';
import { currentUserId } from '@/services/session.cookies';
import { findMatchingConversation } from '@/views/messaging/conversationHelpers';

export interface ReadReceipt {
  conversationId: string;
  readerId: string;
  /** Absent : tous les messages que le lecteur n'avait pas écrits. */
  messageIds?: string[];
}

/**
 * Ajoute le lecteur à `readBy` des messages concernés. Exportée pour la vue de
 * messagerie, qui garde sa propre liste de messages affichés.
 */
export function applyReadReceipt(
  messages: Pick<Message, '_id' | 'sender' | 'readBy'>[],
  receipt: ReadReceipt
): void {
  for (const message of messages) {
    const isConcerned = message.sender?._id !== receipt.readerId &&
      (!receipt.messageIds || receipt.messageIds.includes(message._id));
    if (!isConcerned) continue;
    // Message affiché avant d'avoir été relu par l'API : readBy peut manquer.
    message.readBy = message.readBy ?? [];
    if (!message.readBy.includes(receipt.readerId)) message.readBy.push(receipt.readerId);
  }
}

interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: (Message & { archivedBy?: string[]; favoritedBy?: string[] })[];
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
      // Une conversation sans message retombe sur sa date de création : sans ce
      // repli, `new Date(undefined)` donne NaN et la place au hasard dans le tri.
      const lastActivity = (c: Conversation) => new Date(c.lastMessageAt || c.createdAt).getTime();
      return [...state.conversations].sort((a, b) => lastActivity(b) - lastActivity(a));
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
        this.messages = response.messages.reverse();

        // Mettre à jour la conversation dans la liste
        const index = this.conversations.findIndex(c => c._id === conversationId);
        if (index !== -1) {
          this.conversations[index].unreadCount = response.conversation.unreadCount || 0;
          if(this.conversations[index].participants.length > 0) {
            for (let i = 0; i < this.conversations[index].participants.length; i++) {
              const participant = this.conversations[index].participants[i];

              if(participant._id != currentUserId()) {
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

    async favorite(messageId: string) {
      try {
        await messagingService.favorite(messageId);

        // Trouver le message dans la liste
        const index = this.messages.findIndex(m => m._id === messageId);

        if (index !== -1) {
          const myId = currentUserId() || '';
          // Initialiser favoritedBy si undefined
          if (!this.messages[index].favoritedBy) {
            this.messages[index].favoritedBy = [];
          }

          // Vérifier si l'utilisateur est déjà dans favoritedBy
          const userIndex = this.messages[index].favoritedBy.indexOf(myId);

          if (userIndex !== -1) {
            // L'utilisateur est déjà dans favoritedBy, le retirer
            this.messages[index].favoritedBy.splice(userIndex, 1);
          } else {
            // L'utilisateur n'est pas dans favoritedBy, l'ajouter
            this.messages[index].favoritedBy.push(myId);
          }
        }

      } catch (error) {
        this.error = 'Erreur lors de la modification du favori';
        console.error(error);
        throw error;
      }
    },

    async archiveConversation(messageId: string) {
      try {
        await messagingService.archiveConversation(messageId);
        const myId = currentUserId() || '';

        // Retirer le message de la liste
        const index = this.messages.findIndex(m => m._id === messageId);
        if (index !== -1) {
          this.messages[index].archivedBy?.push(myId);
        }

      } catch (error) {
        this.error = 'Erreur lors de la suppression du message';
        console.error(error);
        throw error;
      }
    },
    async unarchiveConversation(messageId: string) {
      try {
        await messagingService.unarchiveConversation(messageId);
        const myId = currentUserId() || '';

        // Retirer le message de la liste
        const index = this.messages.findIndex(m => m._id === messageId);
        if (index !== -1) {
          const archivedBy = this.messages[index].archivedBy || [];
          const userIndex = archivedBy.indexOf(myId);

          if(!this.messages[index].archivedBy){
            this.messages[index].archivedBy = [];
          }

          if (userIndex !== -1) {
            // Si l'utilisateur a archivé le message, retirer son id de archivedBy
            this.messages[index].archivedBy.splice(userIndex, 1);

          }
        }

      } catch (error) {
        this.error = 'Erreur lors de la suppression du message';
        console.error(error);
        throw error;
      }
    },
    async deleteConversation(coneversationId: string) {
      try {
        await messagingService.deleteConversation(coneversationId);

        // Retirer la conversation de la liste
        const index = this.conversations.findIndex(m => m._id === coneversationId);
        if (index !== -1) {
          this.conversations.splice(index, 1);
        }
      } catch (error) {
        this.error = 'Erreur lors de la suppression de la conversation';
        console.error(error);
        throw error;
      }
    },

    /**
     * Ouvre une conversation (fenêtre « Nouvelle conversation »). L'API peut
     * renvoyer une conversation déjà connue : jamais de doublon dans la liste.
     * @returns la réponse, avec la conversation de la liste quand elle existait déjà
     */
    async startConversation(recipientId: string, productId?: string, initialMessage?: string) {
      try {
        const response = await messagingService.startConversation({
          recipientId,
          productId,
          initialMessage
        });

        const existing = findMatchingConversation(this.conversations, response.conversation, currentUserId());
        if (!existing) this.conversations.unshift(response.conversation);

        return { ...response, conversation: existing ?? response.conversation };
      } catch (error) {
        this.error = 'Erreur lors de la création de la conversation';
        console.error(error);
        throw error;
      }
    },

    async initiateNegotiation(productId: string, initialOffer: number, message?: string) {
      try {
        // Une offre absente est rejetée par le service avant tout envoi.
        const payload: NegotiationRequest = { productId, initialOffer };
        if (message !== undefined) {
          payload.message = message;
        }

        const response = await messagingService.initiateNegotiation(payload);

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
        //await this.fetchConversation(conversationId);

        return response;
      } catch (error) {
        this.error = 'Erreur lors de la réponse à la négociation';
        console.error(error);
        throw error;
      }
    },
    async cancelNegotiation(
      productId: string,
      initialOffer: number,
      conversationId: string,
      message?: string
    ){
      try {
        const response = await messagingService.cancelNegotiation(
          productId,
          initialOffer,
          conversationId,
          message
        );
        // Met à jour la conversation et messages
        await this.fetchConversation(conversationId);
        return response;
      } catch (error) {
        this.error = "Erreur lors de l'envoi de la contre-offre";
        console.error(error);
        throw error;
      }
    },
    async sendCounterOffer(
      conversationId: string,
      counterOffer: number,
      message?: string
    ) {
      try {
        const response = await messagingService.respondToNegotiation(conversationId, {
          action: 'counter',
          counterOffer,
          message
        });
        // Met à jour la conversation et messages
        await this.fetchConversation(conversationId);
        return response;
      } catch (error) {
        this.error = "Erreur lors de l'envoi de la contre-offre";
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

    // Événements temps réel (SSE), branchés par src/store/realtimeSync.ts
    handleNewMessage(message: Message) {
      // Un message peut arriver deux fois : envoyé depuis cet onglet (déjà
      // ajouté par sendMessage) puis reçu par le flux, commun à tous les onglets.
      const isInCurrentConversation = this.currentConversation?._id === message.conversation;
      if (isInCurrentConversation && !this.messages.some(m => m._id === message._id)) {
        this.messages.push(message);
      }

      const conversation = this.conversations.find(c => c._id === message.conversation);
      if (!conversation) {
        // Nouvelle conversation (ou hors de la page chargée) : on ne recharge la
        // liste que si elle a déjà été chargée, sinon rien ne l'affiche.
        if (this.conversations.length > 0) this.fetchConversations().catch(() => {});
        return;
      }
      if (conversation.lastMessage?._id === message._id) return;

      // lastMessageAt fait remonter la conversation (cf. sortedConversations).
      conversation.lastMessage = message;
      conversation.lastMessageAt = message.createdAt;

      const myId = currentUserId() || '';
      if (message.sender?._id !== myId && !message.readBy.includes(myId)) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        this.updateUnreadCount();
      }
    },

    /** Accusé de lecture : `messageIds` absent = tout ce que le lecteur n'avait pas écrit. */
    handleConversationRead(data: ReadReceipt) {
      if (this.currentConversation?._id === data.conversationId) {
        applyReadReceipt(this.messages, data);
      }

      // Lu depuis un autre onglet ou appareil : plus rien de non lu ici.
      if (data.readerId === currentUserId() && !data.messageIds) {
        const conversation = this.conversations.find(c => c._id === data.conversationId);
        if (conversation) {
          conversation.unreadCount = 0;
          this.updateUnreadCount();
        }
      }
    },

    /** Total calculé par l'API, toutes conversations confondues (et pas seulement la page chargée). */
    applyUnreadCount(total: number) {
      this.unreadCount = total;
    }
  }
});
