<template>
  <NavBar />
  <div class="messages-view">
    <div class="desktop-layout">
      <div class="conversations-column" :class="{ 'hide-mobile': showConversation }">
        <ConversationList @start-conversation="handleStartConversation" />
      </div>

      <div class="conversation-column" :class="{ 'show-mobile': showConversation }">
        <router-view v-if="route.params.id" />
        <div v-else class="no-conversation">
          <i class="bi bi-chat-dots"></i>
          <h3>Sélectionnez une conversation</h3>
          <p>Choisissez une conversation dans la liste ou démarrez-en une nouvelle</p>
          <button @click="handleStartConversation" class="btn-primary button-new-conversation">
            <i class="bi bi-plus"></i> Nouvelle conversation
          </button>
        </div>
      </div>
    </div>

    <div v-if="showNewConversationModal" class="modal-overlay" @click.self="showNewConversationModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Démarrer une nouvelle conversation</h2>
          <button class="close" @click="showNewConversationModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <div class="search-input">
              <label for="search">Rechercher un membre :</label>
              <i class="bi bi-search"></i>
              <input type="text" v-model="searchQuery" @input="handleSearch" placeholder="Rechercher un membre..."
                class="form-control" />
            </div>

            <!-- Résultat de la recherche -->
            <div class="search-results" v-if="searchResults.length">
              <div v-for="(member, index) in searchResults" :key="index" class="search-result-item">
                <div @click="selectMember(member)" class="member-result"
                  :class="{ selected: selectedMember?.id === (member.id) }">
                  <div class="avatar" v-html="renderAvatar(member)"></div>
                  <span>{{ member.username }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="form-control">
            <label for="conversation-name">Message :</label>
            <textarea v-model="initialMessage" rows="4" placeholder="Écrivez votre premier message..."
              class="form-control"></textarea>
          </div>
          <div v-if="productContext" class="product-context">
            <div class="product-card">
              <img :src="productContext.images[0]" :alt="productContext.title" class="product-image" />
              <div class="product-details">
                <h4>{{ productContext.title }}</h4>
                <p>{{ productContext.description }}</p>
                <span class="price">{{ productContext.price }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeNewConversationModal" class="btn-secondary">
              Annuler
            </button>
            <button @click="startConversation" :disabled="!selectedMember" class="btn-primary">
              Démarrer la conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import ConversationList from '@/components/messaging/ConversationList.vue';
import NavBar from '@/components/adherents/nav_bar.vue';
import type { User, Product } from '@/types/messaging.types';
import { useMessagingStore } from '@/store/messaging.store';
import usersService from '@/services/users';
import { useRouter } from 'vue-router';

const route = useRoute();
const showNewConversationModal = ref(false);
const searchQuery = ref('');
const searchResults = ref<User[]>([]);
const selectedMember = ref<User | null>(null);
const initialMessage = ref('');
const productContext = ref<Product | null>(null);
const messagingStore = useMessagingStore();
const router = useRouter();

/**
 * Montre la conversation si l'ID est présent dans les paramètres de la route.
 * @returns {boolean} true si l'ID de la conversation est présent, sinon false
 */
const showConversation = computed(() => {
  return !!route.params.id;
});

/**
 * Gère l'ouverture du modal pour démarrer une nouvelle conversation.
 */
const handleStartConversation = () => {
  showNewConversationModal.value = true;
};

/**
 * Ferme le modal de démarrage de conversation.
 */
const closeNewConversationModal = () => {
  showNewConversationModal.value = false;
  searchQuery.value = '';
  searchResults.value = [];
  selectedMember.value = null;
  initialMessage.value = '';
  productContext.value = null;
};

/**
 * Gère la recherche de membres dans la liste des conversations.
 * @param {Event} event - L'événement d'entrée de l'utilisateur.
 */
const handleSearch = async () => {
  if (searchQuery.value.length < 3) {
    searchResults.value = [];
    return;
  }

  try {
    const response = await usersService.getUserbyName(searchQuery.value);
    let usersArray: User[] = [];

    // Si la réponse est { profile: {...} }
    if (response && response.profile) {
      // Si profile est déjà un tableau
      if (Array.isArray(response.profile)) {
        usersArray = response.profile;
      } else if (typeof response.profile === 'object') {
        // Si profile est un objet (un seul utilisateur)
        usersArray = [response.profile];
      }
    } else if (Array.isArray(response)) {
      usersArray = response;
    } else if (typeof response === 'object' && response.id) {
      usersArray = [response];
    }

    searchResults.value = usersArray.filter(user => user && user.id);
  } catch (error) {
    console.error('Erreur lors de la recherche de membres:', error);
  }
};

/**
 * Sélectionne un membre pour démarrer une conversation.
 * @param {Object} member - Le membre sélectionné.
 */
const selectMember = (member: User) => {
  selectedMember.value = member;
};

/**
 * Démarre une nouvelle conversation avec le membre sélectionné.
 */
const startConversation = async () => {
  if (!selectedMember.value) return;

  const userId = selectedMember.value.id;
  if (!userId) {
    console.error('ID de l’utilisateur manquant pour démarrer la conversation.');
    return;
  }

  try {
    const response = await messagingStore.startConversation(
      userId,
      productContext.value?._id,
      initialMessage.value
    );

    closeNewConversationModal();
    router.push({ name: 'Conversation', params: { id: response.conversation._id } });
  } catch (error) {
    console.error('Erreur lors du démarrage de la conversation:', error);
  }
};

/**
 * Rendu de l'avatar pour un membre.
 * @param {Object} member - Le membre dont l'avatar doit être rendu.
 * @returns {string} Le HTML de l'avatar.
 */
const renderAvatar = (member: User) => {
  const profilePicture = member.profilePicture || (member.profile && member.profile.profilePicture) || '';
  const username = member.username || (member.profile && member.profile.username) || 'Utilisateur';
  if (profilePicture) {
    return `<img src="${profilePicture}" alt="${username}" class="avatar-image" />`;
  }

  const initials = username
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `<div class="avatar-initials">${initials}</div>`;
};
</script>
<style scoped lang="scss">
.messages-view {
  height: calc(100vh - 50px);
  overflow: hidden;
}

.desktop-layout {
  display: flex;
  height: 100%;
}

.conversations-column {
  width: 550px;
  border-right: 1px solid #e0e0e0;
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;

    &.hide-mobile {
      display: none;
    }
  }
}

.conversation-column {
  flex: 1;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    display: none;

    &.show-mobile {
      display: flex;
      width: 100%;
    }
  }
}

.conversations-column {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  &.hide-mobile {
    display: none;
  }
}

.conversation-column {
  flex: 3;
  overflow-y: auto;
  padding: 16px;

  &.show-mobile {
    display: block;
  }
}

.no-conversation {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;

  i {
    font-size: 80px;
    color: #ddd;
    margin-bottom: 20px;
  }

  h3 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 24px;
  }

  p {
    color: #666;
    margin-bottom: 30px;
  }

  .button-new-conversation {
    display: flex;
    align-items: center;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;

    i {
      font-size: 20px;
      display: flex;
      align-items: center;
      margin-bottom: 0;
    }
  }
}

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
  border-radius: 8px;
  width: 90%;
  max-width: 60%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  margin: 0 !important; // Ajouté pour forcer le centrage
  position: relative; // Ajouté pour éviter tout positionnement parasite
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    margin: 0;
    font-size: 20px;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;

    &:hover {
      color: #333;
    }
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;

  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .search-input {
      position: relative;

      i {
        position: absolute;
        left: 12px;
        top: 65%;
        transform: translateY(-50%);
        color: #666;
        font-size: 18px;
        pointer-events: none;
      }

      input {
        padding-left: 40px;
        height: 40px; // Ajoute ou ajuste la hauteur pour un meilleur alignement
        line-height: 40px; // Optionnel : pour centrer le texte verticalement
        box-sizing: border-box;
      }
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
  }

  .search-results {
    margin-top: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    max-height: 200px;
    overflow-y: auto;

    .search-result-item {
      padding: 10px;
      border-bottom: 1px solid #e0e0e0;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }

      &.selected {
        background-color: var(--primary-color);
        color: white;

        .avatar-initials {
          background-color: white;
          color: var(--primary-color);
        }
      }
    }

    .member-result {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
      }

      &.selected {
        background: var(--primary-color);
        color: white;

        .avatar-initials {
          background: white;
          color: var(--primary-color);
        }
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        overflow: hidden;
        background: #e0e0e0;
        flex-shrink: 0;

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
        font-weight: 500;
      }
    }
  }

  .product-context {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 5px;
    margin-top: 20px;

    .product-card {
      display: flex;
      gap: 12px;
      align-items: center;

      img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
      }

      .product-info {
        flex: 1;

        h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        p {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
          color: var(--primary-color);
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 20px;
    border-top: 1px solid #e0e0e0;

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;

      &.btn-secondary {
        background: #f0f0f0;
        color: #333;

        &:hover {
          background: #e0e0e0;
        }
      }

      &.btn-primary {
        background: var(--primary-color);
        color: white;

        &:hover:not(:disabled) {
          opacity: 0.9;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
}



@media (min-width: 768px) {
  .conversations-column.hide-mobile {
    display: block;
  }
}
</style>
