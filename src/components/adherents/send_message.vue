<template>
    <div @click="closePopup" class="msg-modal-overlay">
        <div @click.stop class="msg-modal">
            <div class="msg-modal__header">
                <h2 class="msg-modal__title"><i class="bi bi-chat-dots"></i> Nouvelle conversation</h2>
                <button type="button" class="msg-modal__close" @click="closePopup" aria-label="Close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div class="msg-modal__body">
                <!-- Recherche membre (si pas de destinataire prédéfini) -->
                <div v-if="!id_user && !id_post" class="msg-modal__field">
                    <label class="msg-modal__label">Rechercher un membre</label>
                    <div class="msg-modal__input-wrap">
                        <i class="bi bi-search"></i>
                        <input
                            type="text"
                            v-model="memberSearch"
                            @input="searchMembers"
                            placeholder="Nom d'utilisateur..."
                        />
                    </div>

                    <div v-if="memberSearchResults.length" class="msg-modal__results">
                        <button
                            type="button"
                            v-for="member in memberSearchResults"
                            :key="member._id || member.id"
                            class="msg-modal__result-item"
                            @click="selectMember(member)"
                        >
                            <img v-if="member.profilePicture" :src="getImageUrl(member.profilePicture)" :alt="member.username" class="msg-modal__avatar" />
                            <span v-else class="msg-modal__avatar msg-modal__avatar--letter">{{ member.username?.charAt(0).toUpperCase() }}</span>
                            <div class="msg-modal__result-info">
                                <span class="msg-modal__result-name">
                                  {{ member.username }}
                                  <VerifiedBadge v-if="member.isIdentityVerified" :size="12" />
                                </span>
                                <span v-if="member.bio" class="msg-modal__result-bio">{{ member.bio }}</span>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Destinataire sélectionné -->
                <div v-if="id_user || pseudo_user" class="msg-modal__field">
                    <label class="msg-modal__label">Destinataire</label>
                    <div class="msg-modal__recipient">
                        <img v-if="selectedMember?.avatar || selectedMember?.profilePicture" :src="getImageUrl(selectedMember?.profilePicture || selectedMember?.avatar)" :alt="pseudo_user" class="msg-modal__avatar" />
                        <span v-else class="msg-modal__avatar msg-modal__avatar--letter">{{ pseudo_user?.charAt(0).toUpperCase() }}</span>
                        <span class="msg-modal__recipient-name">{{ pseudo_user }}</span>
                    </div>
                </div>

                <div class="msg-modal__field">
                    <label class="msg-modal__label">Message</label>
                    <textarea
                        class="msg-modal__textarea"
                        v-model="textMessage"
                        rows="4"
                        placeholder="Écrivez votre message..."
                    ></textarea>
                </div>
            </div>
            <div class="msg-modal__footer">
                <button type="button" class="msg-modal__btn msg-modal__btn--ghost" @click="closePopup">
                    Annuler
                </button>
                <button
                    type="button"
                    class="msg-modal__btn msg-modal__btn--primary"
                    @click="sendMessage"
                    :disabled="isButtonDisabled()"
                >
                    <i class="bi bi-send"></i> Envoyer
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import mssagingService from '@/services/messaging.service';
import { useRoute, useRouter } from "vue-router";
import { ref, getCurrentInstance } from 'vue';
import { API_URL } from '@/config/api';
import VerifiedBadge from '@/components/VerifiedBadge.vue';

export interface Member {
    _id?: string;
    id?: string;
    username: string;
    avatar?: string;
    profilePicture?: string;
    bio?: string;
    location?: string;
    email?: string;
    isIdentityVerified?: boolean;
}

interface SearchMembersResponse {
    users?: Member[];
    user?: Member;
}

const API_BASE_URL = API_URL;

export default {
    name: "send_message",

    components: { VerifiedBadge },

    props: {
        pseudo_user: {
            type: String,
            required: false
        },
        id_user: {
            type: String,
            required: false,
            default: null
        },
        id_post: {
            required: false,
            default: null
        }
    },

    setup(props, { emit }) {
        const route = useRoute();
        const router = useRouter();
        const instance = getCurrentInstance();
        const $func = instance?.appContext.config.globalProperties.$func;

        const memberSearch = ref('');
        const memberSearchResults = ref<Member[]>([]);
        const selectedMember = ref<Member | null>(null);
        const textMessage = ref('');

        // Computed pour la désactivation du bouton
        function isButtonDisabled() {
            const hasMessage = textMessage.value.trim() !== '';
            return !hasMessage;
        }

        // Fonction pour construire l'URL complète de l'image
        const getImageUrl = (imagePath?: string): string => {
            if (!imagePath) {
                return '/api/placeholder/50/50';
            }
            // Si le chemin commence déjà par http, le retourner tel quel
            if (imagePath.startsWith('http')) {
                return imagePath;
            }
            // Sinon, ajouter le domaine API
            return `${API_BASE_URL}${imagePath}`;
        };

        // Pré-sélection si on a déjà un utilisateur ciblé
        if (props.id_user || props.pseudo_user) {
            selectedMember.value = {
                _id: props.id_user,
                username: props.pseudo_user
            } as Member;
        }

        const searchMembers = async () => {
            if (memberSearch.value.length < 2) {
                memberSearchResults.value = [];
                return;
            }

            try {
                const response = await mssagingService.getUserByName(memberSearch.value);
                // Le service retourne soit 'users' (tableau) soit 'user' (objet unique)
                const responseData = response as SearchMembersResponse;
                if (responseData.users && Array.isArray(responseData.users)) {
                    memberSearchResults.value = responseData.users;
                } else if (responseData.user) {
                    memberSearchResults.value = [responseData.user];
                } else {
                    memberSearchResults.value = [];
                }
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
                memberSearchResults.value = [];
            }
        };

        const selectMember = (member: Member) => {
            selectedMember.value = member;
            memberSearch.value = member.username;
            memberSearchResults.value = [];
        };

        const closePopup = () => {
            emit('closeSendMessage');
        };

        const sendMessage = () => {
            const recipientId = selectedMember.value?._id || selectedMember.value?.id || props.id_user;

            if (!recipientId) {
                $func?.showToastError('Veuillez sélectionner un destinataire');
                return;
            }

            if (textMessage.value.trim() === '') {
                $func?.showToastError('Veuillez saisir un message');
                return;
            }

            mssagingService.startConversation({
                recipientId: recipientId,
                initialMessage: textMessage.value,
                productId: props.id_post ?? undefined,
            }).then((response) => {
                $func?.showToastSuccess('Message envoyé avec succès');
                emit('newConversationCreated', response.conversation);
                closePopup();
            }).catch((error) => {
                console.error('Erreur lors de l\'envoi:', error);
                $func?.showToastError('Erreur lors de l\'envoi du message');
            });
        };

        return {
            route,
            router,
            memberSearch,
            memberSearchResults,
            selectedMember,
            textMessage,
            isButtonDisabled,
            searchMembers,
            selectMember,
            closePopup,
            sendMessage,
            getImageUrl
        };
    }
}
</script>

<style lang="scss" scoped>
.msg-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: var(--space-lg);
  animation: fadeIn 0.15s ease;
}

.msg-modal {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  width: 480px;
  max-width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.25s ease;
  overflow: hidden;
}

.msg-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--surface-border);
}

.msg-modal__title {
  font-size: var(--font-size-md);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  i { color: var(--accent-pink); }
}

.msg-modal__close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);

  &:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }
}

.msg-modal__body {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  overflow-y: auto;
}

.msg-modal__field {}

.msg-modal__label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.msg-modal__input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:focus-within {
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
  }

  i { color: var(--text-muted); font-size: var(--font-size-sm); }

  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: var(--space-md) 0;
    color: var(--text-primary);
    font-size: var(--font-size-sm);

    &::placeholder { color: var(--text-muted); }
  }
}

.msg-modal__results {
  margin-top: var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  max-height: 200px;
  overflow-y: auto;
}

.msg-modal__result-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-md);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--surface-border);
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);

  &:last-child { border-bottom: none; }
  &:hover { background: var(--bg-secondary); }
}

.msg-modal__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;

  &--letter {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-gradient);
    color: white;
    font-weight: 700;
    font-size: var(--font-size-md);
  }
}

.msg-modal__result-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.msg-modal__result-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.msg-modal__result-bio {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.msg-modal__recipient {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.msg-modal__recipient-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.msg-modal__textarea {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-sans);
  resize: vertical;
  min-height: 100px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &::placeholder { color: var(--text-muted); }

  &:focus {
    outline: none;
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
  }
}

.msg-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--surface-border);
}

.msg-modal__btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-xs);

  &--ghost {
    background: transparent;
    border: 1px solid var(--surface-border);
    color: var(--text-secondary);

    &:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }
  }

  &--primary {
    background: var(--accent-gradient);
    border: none;
    color: white;

    &:hover { opacity: 0.9; transform: translateY(-1px); }
    &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
