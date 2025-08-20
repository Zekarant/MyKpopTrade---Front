<template>
  <div class="conversation-list">
    <div class="tabs">
      <button @click="setTab('product_inquiry')" :class="{ active: currentTab === 'product_inquiry' }">BST</button>
      <button @click="setTab('general')" :class="{ active: currentTab === 'general' }">Messages Privés</button>
      <button @click="setTab('negotiation')" :class="{ active: currentTab === 'negotiation' }">Groupes</button>
      <button @click="setTab('pay_what_you_want')" :class="{ active: currentTab === 'pay_what_you_want' }">Invitations</button>
    </div>

    <div class="filters">
      <div class="achat-filter" @click="toggleSortOrder">
        Achat
        <span v-if="sortOrder === 'recent'">&#8595;</span>
        <span v-else>&#8593;</span>
      </div>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Rechercher une conversation..."
        class="search-bar"
      />
    </div>

    <div v-if="loading" class="loading">
      Chargement des conversations...
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadConversations" class="retry-button">Réessayer</button>
    </div>

    <ul class="conversation-list-items" v-else>
      <li
        v-for="conversation in filteredAndSortedConversations"
        :key="conversation._id"
        class="conversation-item"
        :class="{ 'unread': (conversation.unreadCount ?? 0) > 0 }"
        @click="selectConversation(conversation)"
      >
        <div class="conversation-avatar">
          <template >
            <div class="userPicture" v-html="getAvatar(conversation.otherParticipant)"></div>
          </template>
          <!--<template v-else>
            <div class="avatar-initials">
              {{ getAvatarInitials(conversation.otherParticipant) }}
            </div>
          </template>-->
        </div>

        <div class="conversation-details">
          <div class="conversation-header">
            <span class="username">{{ getParticipantUsername(conversation.otherParticipant) }}</span>
            <span class="country">{{ getParticipantLocation(conversation.otherParticipant) }}</span>
            <span v-if="(conversation.unreadCount ?? 0) > 0" class="unread-badge">
              {{ conversation.unreadCount ?? 0 }}
            </span>
          </div>

          <div class="conversation-meta">
            <!-- Onglet BST : Affichage produit -->
            <template v-if="currentTab === 'product_inquiry' && conversation.productId">
              <span class="product-title">{{ getProductTitle(conversation.productId) }}</span>
              <span class="product-price">{{ formatPrice(conversation.productId) }}</span>
              <span class="product-condition">{{ formatCondition(conversation.productId) }}</span>
              <span
                v-if="conversation.negotiation"
                class="negotiation-status"
                :class="getNegotiationStatusClass(conversation.negotiation.status)"
              >
                {{ formatNegotiationStatus(conversation.negotiation.status) }}
              </span>
            </template>

            <!-- Onglet Messages Privés : Statut lecture ou aperçu -->
            <template v-else-if="currentTab === 'general'">
              <div class="message-status">
                <template v-if="isMessageRead(conversation)">
                  <span class="read-status">Vu {{ formatLastSeen(conversation.lastMessageAt) }}</span>
                </template>
                <template v-else>
                  <span class="message-preview">{{ getMessagePreview(conversation) }}</span>
                </template>
              </div>
            </template>

            <!-- Autres onglets : Affichage par défaut -->
            <template v-else>
              <span class="conversation-type">{{ getConversationType(conversation.type) }}</span>
              <span class="conversation-state">{{ getConversationStatus(conversation.status) }}</span>
              <span
                v-if="conversation.negotiation"
                class="negotiation-status"
                :class="getNegotiationStatusClass(conversation.negotiation.status)"
              >
                {{ formatNegotiationStatus(conversation.negotiation.status) }}
              </span>
              <span
                v-if="conversation.payWhatYouWant"
                class="pwyw-status"
                :class="getPwywStatusClass(conversation.payWhatYouWant.status)"
              >
                {{ formatPwywStatus(conversation.payWhatYouWant.status) }}
              </span>
            </template>
          </div>

          <div class="conversation-footer">
            <span class="last-message-time">{{ formatLastMessageTime(conversation.lastMessageAt) }}</span>
            <span class="status-badge" :class="conversation.status">{{ getConversationStatus(conversation.status) }}</span>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="!loading && !error && filteredAndSortedConversations.length === 0" class="no-conversations">
      Aucune conversation à afficher.
    </div>
  </div>
</template>

<script lang="ts" setup>
import messagingService from '@/services/messaging.service';
import { ref, computed, onMounted } from 'vue';
import type { Conversation, ConversationListParams, ProductReference } from '@/types/messaging.types';
import type { ImgUserProfile, IUserParticipant } from '@/types/user.types';
import userService from '@/services/user.service';

// Types pour les onglets
type TabType = 'general' | 'product_inquiry' | 'negotiation' | 'pay_what_you_want';
type SortOrder = 'recent' | 'oldest';

// État réactif
const currentTab = ref<TabType>('product_inquiry');
const loading = ref<boolean>(false);
const error = ref<string>('');
const sortOrder = ref<SortOrder>('recent');
const searchQuery = ref<string>('');
const conversations = ref<Conversation[]>([]);

// Événements émis
const emit = defineEmits<{
  conversationSelected: [conversation: Conversation]
}>();

// ============================================================================
// FONCTIONS UTILITAIRES - NAVIGATION ET ÉTAT
// ============================================================================

/**
 * Change l'onglet actif
 */
const setTab = (tab: TabType): void => {
  currentTab.value = tab;
};

/**
 * Bascule l'ordre de tri
 */
const toggleSortOrder = (): void => {
  sortOrder.value = sortOrder.value === 'recent' ? 'oldest' : 'recent';
};

/**
 * Sélectionne une conversation
 */
const selectConversation = (conversation: Conversation): void => {
  emit('conversationSelected', conversation);
};

// ============================================================================
// FONCTIONS UTILITAIRES - PARTICIPANTS
// ============================================================================

/**
 * Vérifie si un participant a une photo de profil valide
 */
/*const hasValidProfilePicture = (participant: IUserParticipant | undefined): boolean => {
  return Boolean(
    participant?.profilePicture &&
    participant.profilePicture !== 'https://mykpoptrade.com/images/avatar-default.png'
  );
};*/


/**
 * Récupère les initiales pour l'avatar
 */
const getAvatarInitials = (participant: IUserParticipant | undefined): string => {
  if (!participant?.username) return '?';
  return participant.username.charAt(0).toUpperCase();
};

/**
 * on créer l'avatar de l'utilisateur
 */

const getAvatar = (user: IUserParticipant | undefined): string => {
  if (!user) {
    return 'https://mykpoptrade.com/images/avatar-default.png'; // or return a default avatar URL
  }
  const profileImgInfo: ImgUserProfile = {
    username: user.username,
    profilePicture: user.profilePicture
  };
  return userService.renderUserAvatar(profileImgInfo);
};
/**
 * Récupère le nom d'utilisateur d'un participant
 */
const getParticipantUsername = (participant: IUserParticipant | undefined): string => {
  return participant?.username || 'Utilisateur inconnu';
};

/**
 * Récupère la localisation d'un participant
 */
const getParticipantLocation = (participant: IUserParticipant | undefined): string => {
  return participant?.location || 'Localisation inconnue';
};

// ============================================================================
// FONCTIONS UTILITAIRES - PRODUITS
// ============================================================================

/**
 * Récupère le titre du produit
 */
const getProductTitle = (product: ProductReference | null | undefined): string => {
  return product?.title || 'Conversation générale';
};

/**
 * Formate le prix du produit avec devise
 */
const formatPrice = (product: ProductReference | null | undefined): string => {
  if (!product?.price) return '';
  const currency = product.currency || 'EUR';
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
  return `${product.price}${symbol}`;
};

/**
 * Formate la condition du produit
 */
const formatCondition = (product: ProductReference | null | undefined): string => {
  if (!product || !('condition' in product) || typeof (product as ProductReference & { condition?: string }).condition !== 'string') return '';

  const conditionMap: Record<string, string> = {
    'new': 'Neuf',
    'likeNew': 'Comme neuf',
    'good': 'Bon état',
    'fair': 'État correct',
    'poor': 'Mauvais état'
  };

  const condition = (product as ProductReference & { condition?: string }).condition;
  return condition ? (conditionMap[condition] || '') : '';
};

// ============================================================================
// FONCTIONS UTILITAIRES - STATUTS ET NÉGOCIATIONS
// ============================================================================

/**
 * Formate le statut de négociation
 */
const formatNegotiationStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'En attente',
    'accepted': 'Acceptée',
    'rejected': 'Refusée',
    'expired': 'Expirée',
    'completed': 'Terminée'
  };
  return statusMap[status] || status;
};

/**
 * Récupère la classe CSS pour le statut de négociation
 */
const getNegotiationStatusClass = (status: string): string => {
  const classMap: Record<string, string> = {
    'pending': 'status-pending',
    'accepted': 'status-accepted',
    'rejected': 'status-rejected',
    'expired': 'status-expired',
    'completed': 'status-completed'
  };
  return classMap[status] || '';
};

/**
 * Formate le statut Pay What You Want
 */
const formatPwywStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'En attente',
    'accepted': 'Accepté',
    'rejected': 'Refusé'
  };
  return statusMap[status] || status;
};

/**
 * Récupère la classe CSS pour le statut PWYW
 */
const getPwywStatusClass = (status: string): string => {
  const classMap: Record<string, string> = {
    'pending': 'pwyw-pending',
    'accepted': 'pwyw-accepted',
    'rejected': 'pwyw-rejected'
  };
  return classMap[status] || '';
};

/**
 * Traduit le type de conversation
 */
const getConversationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'general': 'BST',
    'product_inquiry': 'Message privé',
    'negotiation': 'Négociation',
    'pay_what_you_want': 'Prix libre'
  };
  return typeMap[type] || type;
};

/**
 * Traduit le statut de conversation
 */
const getConversationStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'open': 'Ouverte',
    'closed': 'Fermée',
    'archived': 'Archivée'
  };
  return statusMap[status] || status;
};

// ============================================================================
// FONCTIONS UTILITAIRES - MESSAGES ET TEMPS
// ============================================================================

/**
 * Vérifie si le dernier message a été lu
 */
const isMessageRead = (conversation: Conversation): boolean => {
  const unreadCount = conversation.unreadCount ?? 0;
  return unreadCount === 0 && !!conversation.lastMessage;
};

/**
 * Formate le temps depuis la dernière lecture/message
 */
const formatLastSeen = (lastMessageAt: string | undefined): string => {
  if (!lastMessageAt) return '';

  const now = new Date();
  const messageDate = new Date(lastMessageAt);
  const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'à l\'instant';
  if (diffInMinutes < 60) return `il y a ${diffInMinutes}min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `il y a ${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `il y a ${diffInDays}j`;

  return messageDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });
};

/**
 * Formate l'heure du dernier message
 */
const formatLastMessageTime = (lastMessageAt: string | undefined): string => {
  if (!lastMessageAt) return '';

  const messageDate = new Date(lastMessageAt);
  const now = new Date();
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (diffInHours < 24 * 7) {
    return messageDate.toLocaleDateString('fr-FR', {
      weekday: 'short'
    });
  }

  return messageDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });
};

/**
 * Récupère l'aperçu du dernier message
 */
const getMessagePreview = (conversation: Conversation): string => {
  if (!conversation.lastMessage) return 'Aucun message';

  const message = conversation.lastMessage;

  // Gestion des messages chiffrés
  if ('isEncrypted' in message && message.isEncrypted) return '🔒 Message chiffré';

  // Gestion des différents types de contenu
  switch (message.contentType) {
    case 'system_notification':
      return `ℹ️ ${message.content}`;
    case 'offer':
      return `💰 ${message.content}`;
    case 'counter_offer':
      return `🔄 ${message.content}`;
    case 'shipping_update':
      return `📦 ${message.content}`;
    default:
      // Message texte normal
      const preview = ('preview' in message && message.preview) || message.content || '';
      return preview.length > 60 ? preview.substring(0, 60) + '...' : preview;
  }
};

// ============================================================================
// FONCTIONS DE CHARGEMENT ET FILTRAGE
// ============================================================================

/**
 * Charge les conversations de l'utilisateur
 */
const loadConversations = async (): Promise<void> => {
  loading.value = true;
  error.value = '';

  try {
    const params: ConversationListParams = {};
    const response = await messagingService.getUserConversations(params);

    if (response?.conversations) {
      // Normaliser les conversations pour s'assurer que unreadCount existe
      conversations.value = response.conversations.map(conv => ({
        ...conv,
        unreadCount: conv.unreadCount ?? 0 // Valeur par défaut si manquante
      }));
    } else {
      error.value = 'Aucune conversation trouvée';
    }
  } catch (err) {
    console.error('Erreur lors du chargement des conversations:', err);
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

/**
 * Filtre les conversations selon l'onglet actif
 */
const filteredConversations = computed((): Conversation[] => {
  return conversations.value.filter(conv => {
    // Filtrer par type d'onglet
    if (conv.type !== currentTab.value) return false;

    // Exclure les conversations terminées
    if (conv.status === 'completed' || conv.status === 'archived') return false;

    return true;
  });
});

/**
 * Filtre et trie les conversations
 */
const filteredAndSortedConversations = computed((): Conversation[] => {
  let filtered = [...filteredConversations.value];

  // Filtrage par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(conversation => {
      const title = conversation.title || '';
      const username = conversation.otherParticipant?.username || '';
      const productTitle = conversation.productId?.title || '';

      return title.toLowerCase().includes(query) ||
             username.toLowerCase().includes(query) ||
             productTitle.toLowerCase().includes(query);
    });
  }

  // Tri par date
  filtered.sort((a, b) => {
    const dateA = new Date(a.lastMessageAt || a.createdAt).getTime();
    const dateB = new Date(b.lastMessageAt || b.createdAt).getTime();

    return sortOrder.value === 'recent' ? dateB - dateA : dateA - dateB;
  });

  return filtered;
});
// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  loadConversations();
});
</script>

<style scoped lang="scss">
// ============================================================================
// VARIABLES ET COULEURS
// ============================================================================
$primary-color: #007bff;
$success-color: #28a745;
$warning-color: #ffc107;
$danger-color: #dc3545;
$info-color: #17a2b8;
$light-gray: #f8f9fa;
$medium-gray: #6c757d;
$dark-gray: #343a40;

// ============================================================================
// LAYOUT PRINCIPAL
// ============================================================================
.conversation-list {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

// ============================================================================
// ONGLETS
// ============================================================================
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.tabs button {
  padding: 12px 15px;
  border: none;
  background: transparent;
  color: $medium-gray;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;

  &:hover {
    color: $primary-color;
    background: rgba($primary-color, 0.05);
  }

  &.active {
    color: $primary-color;
    border-bottom-color: $primary-color;
    font-weight: 600;
  }
}

// ============================================================================
// FILTRES
// ============================================================================
.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.achat-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: $light-gray;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
  min-width: 120px;

  &:hover {
    background: darken($light-gray, 5%);
  }

  span {
    color: $medium-gray;
    font-size: 12px;
  }
}

.search-bar {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  color: $dark-gray;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }

  &::placeholder {
    color: $medium-gray;
  }
}

// ============================================================================
// ÉTATS DE CHARGEMENT
// ============================================================================
.loading,
.error,
.no-conversations {
  text-align: center;
  padding: 60px 20px;
  color: $medium-gray;
}

.error {
  color: $danger-color;

  .retry-button {
    margin-top: 15px;
    padding: 10px 20px;
    background: $primary-color;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;

    &:hover {
      background: darken($primary-color, 10%);
    }
  }
}

// ============================================================================
// LISTE DES CONVERSATIONS
// ============================================================================
.conversation-list-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.conversation-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  border: 1px solid transparent;

  &:hover {
    background: $light-gray;
    border-color: #e9ecef;
  }

  &.unread {
    background: rgba($primary-color, 0.05);
    border-color: rgba($primary-color, 0.2);
  }
}

// ============================================================================
// AVATAR
// ============================================================================
.conversation-avatar {
  width: 50px;
  min-width: 50px;
  height: 50px;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
}

.avatar-initials {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary-color, lighten($primary-color, 20%));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

// ============================================================================
// DÉTAILS DE LA CONVERSATION
// ============================================================================
.conversation-details {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: $dark-gray;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.country {
  font-size: 12px;
  color: $medium-gray;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.unread-badge {
  background: $danger-color;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  flex-shrink: 0;
}

// ============================================================================
// MÉTADONNÉES DE CONVERSATION
// ============================================================================
.conversation-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.product-price {
  color: $success-color;
  font-weight: 600;
  font-size: 11px;
  background: rgba($success-color, 0.1);
  padding: 2px 5px;
  border-radius: 3px;
}

.product-condition {
  color: $info-color;
  font-size: 10px;
  background: rgba($info-color, 0.1);
  padding: 2px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  font-weight: 500;
}

.message-status {
  width: 100%;
}

.read-status {
  color: $medium-gray;
  font-style: italic;
  font-size: 12px;
}

.message-preview {
  color: $dark-gray;
  font-size: 13px;
  line-height: 1.4;
}

.conversation-type,
.conversation-state {
  font-size: 12px;
  color: $medium-gray;
  background: rgba($medium-gray, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

// ============================================================================
// STATUTS ET BADGES
// ============================================================================
.negotiation-status,
.pwyw-status {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.status-pending {
  background: rgba($warning-color, 0.2);
  color: darken($warning-color, 20%);
}

.status-accepted {
  background: rgba($success-color, 0.2);
  color: darken($success-color, 20%);
}

.status-rejected {
  background: rgba($danger-color, 0.2);
  color: darken($danger-color, 20%);
}

.status-expired,
.status-completed {
  background: rgba($medium-gray, 0.2);
  color: darken($medium-gray, 20%);
}

.pwyw-pending {
  background: rgba($info-color, 0.2);
  color: darken($info-color, 20%);
}

.pwyw-accepted {
  background: rgba($success-color, 0.2);
  color: darken($success-color, 20%);
}

.pwyw-rejected {
  background: rgba($danger-color, 0.2);
  color: darken($danger-color, 20%);
}

// ============================================================================
// PIED DE CONVERSATION
// ============================================================================
.conversation-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.last-message-time {
  font-size: 11px;
  color: $medium-gray;
  white-space: nowrap;
}

.status-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
  text-transform: capitalize;
  white-space: nowrap;

  &.open {
    background: rgba($success-color, 0.2);
    color: darken($success-color, 20%);
  }

  &.closed {
    background: rgba($medium-gray, 0.2);
    color: darken($medium-gray, 20%);
  }

  &.archived {
    background: rgba($medium-gray, 0.3);
    color: darken($medium-gray, 30%);
  }
}

// ============================================================================
// STYLES BST SPÉCIFIQUES
// ============================================================================
.bst-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.bst-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bst-details {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.bst-status {
  display: flex;
  align-items: center;
}

.transaction-type {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.transaction-buy {
  background: rgba($info-color, 0.2);
  color: darken($info-color, 20%);
}

.transaction-sell {
  background: rgba($success-color, 0.2);
  color: darken($success-color, 20%);
}

.transaction-trade {
  background: rgba($warning-color, 0.2);
  color: darken($warning-color, 20%);
}

.separator {
  color: $medium-gray;
  font-size: 12px;
}

.artist-info {
  font-weight: 600;
  color: $dark-gray;
  font-size: 13px;
  flex: 1;
}

.product-type {
  font-size: 11px;
  background: rgba($primary-color, 0.1);
  color: darken($primary-color, 20%);
  padding: 2px 5px;
  border-radius: 3px;
  font-weight: 500;
}

.official-status {
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  font-weight: 600;
  background: rgba($success-color, 0.15);
  color: darken($success-color, 25%);
}

// ============================================================================
// RESPONSIVE DESIGN
// ============================================================================
@media (max-width: 768px) {
  .conversation-list {
    padding: 15px;
  }

  .filters {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .achat-filter {
    min-width: auto;
  }

  .conversation-item {
    gap: 12px;
    padding: 12px;
  }

  .conversation-avatar {
    width: 40px;
    min-width: 40px;
    height: 40px;
  }

  .avatar-initials {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .conversation-meta {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .conversation-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>
