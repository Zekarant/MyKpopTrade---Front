<template>
    <div @click="closePopup" class="modal-overlay">
        <div @click.stop class="modal">
            <div class="modal-header">
                <h2 class="modal-title mb-0">Nouvelle conversation</h2>
                <button type="button" class="btn-close" @click="closePopup" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Afficher la recherche uniquement si pas de destinataire prédéfini -->
                <div v-if="!id_user && !id_post" class="mb-3">
                    <label class="form-label fw-medium">Rechercher un membre :</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                            <i class="bi bi-search text-muted"></i>
                        </span>
                        <input
                            type="text"
                            class="form-control border-start-0 "
                            v-model="memberSearch"
                            @input="searchMembers"
                            placeholder="Nom d'utilisateur..."
                        />
                    </div>

                    <div v-if="memberSearchResults.length" class="list-group mt-2 shadow-sm" style="max-height: 300px; overflow-y: auto;">
                        <button
                            type="button"
                            v-for="member in memberSearchResults"
                            :key="member._id || member.id"
                            class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3"
                            @click="selectMember(member)"
                        >
                            <img :src="getImageUrl(member.profilePicture)" :alt="member.username" class="rounded-circle" width="50" height="50" style="object-fit: cover; border: 2px solid #e9ecef;" />
                            <div class="flex-grow-1 text-start">
                                <div class="fw-semibold">{{ member.username }}</div>
                                <div v-if="member.bio" class="text-muted small text-truncate" style="max-width: 300px;">{{ member.bio }}</div>
                                <div v-if="member.location" class="text-muted small">
                                    <i class="bi bi-geo-alt"></i>
                                    {{ member.location }}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Afficher le destinataire sélectionné si on est sur un profil -->
                <div v-if="id_user || pseudo_user" class="mb-3">
                    <label class="form-label fw-medium">Destinataire :</label>
                    <div class="alert alert-info d-flex align-items-center gap-2 mb-0">
                        <img :src="selectedMember?.avatar || '/api/placeholder/36/36'" :alt="pseudo_user" class="rounded-circle" width="36" height="36" style="object-fit: cover;" />
                        <span class="fw-medium">{{ pseudo_user }}</span>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label fw-medium">Message initial :</label>
                    <textarea
                        class="form-control txt_message"
                        v-model="textMessage"
                        rows="4"
                        placeholder="Écrivez votre message..."
                    ></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="closePopup">
                    Annuler
                </button>
                <button
                    type="button"
                    class="btn btn-primary"
                    @click="sendMessage"
                    :disabled="isButtonDisabled()"
                >
                    Envoyer 
                    <i class="bi bi-send ms-1"></i>
                </button>
            </div>
        </div>
    </div>
</template>
  
<script lang="ts">
import mssagingService from '@/services/messaging.service';
import { useRoute, useRouter } from "vue-router";
import { ref, getCurrentInstance } from 'vue';

export interface Member {
    _id?: string;
    id?: string;
    username: string;
    avatar?: string;
    profilePicture?: string;
    bio?: string;
    location?: string;
    email?: string;
}

interface SearchMembersResponse {
    users?: Member[];
    user?: Member;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default {
    name: "send_message",
   
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
                console.log('Response de searchMembers:', response);
                
                // Le service retourne soit 'users' (tableau) soit 'user' (objet unique)
                const responseData = response as SearchMembersResponse;
                if (responseData.users && Array.isArray(responseData.users)) {
                    memberSearchResults.value = responseData.users;
                } else if (responseData.user) {
                    memberSearchResults.value = [responseData.user];
                } else {
                    memberSearchResults.value = [];
                }
                
                console.log('Résultats de recherche après traitement:', memberSearchResults.value);
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
                memberSearchResults.value = [];
            }
        };
        
        const selectMember = (member: Member) => {
            selectedMember.value = member;
            memberSearch.value = member.username;
            memberSearchResults.value = [];
            console.log('Membre sélectionné:', member);
        };
        
        const closePopup = () => {
            emit('closeSendMessage');
        };
        
        const sendMessage = () => {
            const recipientId = selectedMember.value?._id || selectedMember.value?.id || props.id_user;
            
            if (!recipientId) {
                console.log('ERREUR: Pas de destinataire');
                $func?.showToastError('Veuillez sélectionner un destinataire');
                return;
            }

            if (textMessage.value.trim() === '') {
                console.log('ERREUR: Message vide');
                $func?.showToastError('Veuillez saisir un message');
                return;
            }

            mssagingService.startConversation({
                recipientId: recipientId,
                initialMessage: textMessage.value,
                productId: props.id_post ?? undefined, 
            }).then((response) => {
                console.log('Message envoyé avec succès:', response);
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
@use '../../css/messaging/send_message.scss';
</style>
