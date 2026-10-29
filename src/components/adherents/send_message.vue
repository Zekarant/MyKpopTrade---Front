<template>
    <div v-dismiss="closePopup" class="popup-overlay">
        <div ref="dialog" class="msg-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
            <div class="msg-modal__header">
                <h2 :id="titleId" class="msg-modal__title"><i class="bi bi-chat-dots" aria-hidden="true"></i> Nouvelle conversation</h2>
                <button type="button" class="msg-modal__close" aria-label="Fermer" @click="closePopup">
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
            </div>
            <div class="msg-modal__body">
                <!-- Recherche membre (si pas de destinataire prédéfini) -->
                <div v-if="!idUser && !idPost" class="msg-modal__field">
                    <label :for="searchId" class="msg-modal__label">Rechercher un membre</label>
                    <div class="msg-modal__input-wrap">
                        <i class="bi bi-search" aria-hidden="true"></i>
                        <input
                            :id="searchId"
                            ref="searchInput"
                            v-model="memberSearch"
                            data-no-draft
                            type="text"
                            placeholder="Nom d'utilisateur..."
                            @input="searchMembers"
                        />
                    </div>

                    <div v-if="memberSearchResults.length" class="msg-modal__results">
                        <button
                            v-for="member in memberSearchResults"
                            :key="member._id || member.id"
                            type="button"
                            class="msg-modal__result-item"
                            @click="selectMember(member)"
                        >
                            <span class="msg-modal__avatar"><UserAvatar :user="member" /></span>
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
                <div v-if="idUser || pseudoUser" class="msg-modal__field">
                    <span class="msg-modal__label">Destinataire</span>
                    <div class="msg-modal__recipient">
                        <span class="msg-modal__avatar"><UserAvatar :user="recipient" /></span>
                        <span class="msg-modal__recipient-name">{{ pseudoUser }}</span>
                    </div>
                </div>

                <div class="msg-modal__field">
                    <label :for="messageId" class="msg-modal__label">Message</label>
                    <textarea
                        :id="messageId"
                        ref="messageInput"
                        v-model="textMessage"
                        class="msg-modal__textarea"
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
                    :disabled="isButtonDisabled()"
                    @click="sendMessage"
                >
                    <i class="bi bi-send"></i> Envoyer
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/** Nouvelle conversation : vers un membre donné (profil, annonce) ou cherché par son pseudo. */
import { computed, ref, useId } from 'vue';
import messagingService from '@/services/messaging.service';
import { useMessagingStore } from '@/store/messaging.store';
import { func } from '@/function';
import { useDialogFocus } from '@/composables/useDialogFocus';
import VerifiedBadge from '@/components/VerifiedBadge.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import type { Conversation } from '@/types/messaging.types';
import { vDismiss } from '@/composables/vDismiss';

interface Member {
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

const props = defineProps<{
    pseudoUser?: string;
    idUser?: string | null;
    idPost?: string | null;
}>();

const emit = defineEmits<{
    closeSendMessage: [];
    newConversationCreated: [conversation: Conversation];
}>();

const messagingStore = useMessagingStore();

const dialog = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLElement | null>(null);
const titleId = `send-message-title-${useId()}`;
const searchId = `send-message-search-${useId()}`;
const messageId = `send-message-text-${useId()}`;

// Premier champ utile : la recherche si aucun destinataire n'est imposé, sinon le message.
useDialogFocus(dialog, computed(() => searchInput.value ?? messageInput.value), closePopup);

const memberSearch = ref('');
const memberSearchResults = ref<Member[]>([]);
// Destinataire imposé par le parent (profil, annonce), sinon choisi dans la recherche.
const selectedMember = ref<Member | null>(
    props.idUser || props.pseudoUser ? { _id: props.idUser ?? undefined, username: props.pseudoUser ?? '' } : null
);
const textMessage = ref('');

const recipient = computed(() => ({
    username: props.pseudoUser,
    profilePicture: selectedMember.value?.profilePicture || selectedMember.value?.avatar,
}));

function isButtonDisabled() {
    return textMessage.value.trim() === '';
}

async function searchMembers() {
    if (memberSearch.value.length < 2) {
        memberSearchResults.value = [];
        return;
    }

    try {
        // Le service retourne soit 'users' (tableau) soit 'user' (objet unique)
        const response = await messagingService.getUserByName(memberSearch.value) as SearchMembersResponse;
        if (Array.isArray(response.users)) {
            memberSearchResults.value = response.users;
        } else {
            memberSearchResults.value = response.user ? [response.user] : [];
        }
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        memberSearchResults.value = [];
    }
}

function selectMember(member: Member) {
    selectedMember.value = member;
    memberSearch.value = member.username;
    memberSearchResults.value = [];
}

function closePopup() {
    emit('closeSendMessage');
}

function sendMessage() {
    const recipientId = selectedMember.value?._id || selectedMember.value?.id || props.idUser;

    if (!recipientId) {
        func.showToastError('Veuillez sélectionner un destinataire');
        return;
    }

    if (textMessage.value.trim() === '') {
        func.showToastError('Veuillez saisir un message');
        return;
    }

    // Le store range la conversation dans la liste, sans doublon.
    messagingStore.startConversation(recipientId, props.idPost ?? undefined, textMessage.value).then((response) => {
        func.showToastSuccess('Message envoyé avec succès');
        emit('newConversationCreated', response.conversation);
        closePopup();
    }).catch((error) => {
        console.error('Erreur lors de l\'envoi:', error);
        func.showToastError('Erreur lors de l\'envoi du message');
    });
}
</script>

<style lang="scss" scoped>
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
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-pink) 10%, transparent);
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
  overflow: hidden;
  flex-shrink: 0;
  font-size: var(--font-size-md);
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
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-pink) 10%, transparent);
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
    color: var(--text-on-accent);

    &:hover { opacity: 0.9; transform: translateY(-1px); }
    &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  }
}
</style>
