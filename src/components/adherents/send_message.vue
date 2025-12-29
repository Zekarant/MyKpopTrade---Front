<template>
    <div @click="closePopup" class="modal-overlay">
        <div @click.stop class="modal">
            <div class="modal-header">
                <h2>Nouvelle conversation</h2>
                <button class="close-btn" @click="closePopup">&times;</button>
            </div>
            <div class="modal-body">
                <!-- Afficher la recherche uniquement si pas de destinataire prédéfini -->
                <div v-if="!id_user && !id_post" class="search-member">
                    <label>Rechercher un membre :</label>
                    <div class="search-input">
                        <i class="bi bi-search"></i>
                        <input
                            type="text"
                            v-model="memberSearch"
                            @input="searchMembers"
                            placeholder="Nom d'utilisateur..."
                        />
                    </div>

                    <div class="search-results" v-if="memberSearchResults.length">
                        <div
                            v-for="member in memberSearchResults"
                            :key="member._id || member.id"
                            class="member-result"
                            :class="{ selected: selectedMember?._id === member._id || selectedMember?.id === member.id }"
                            @click="selectMember(member)"
                        >
                            <img :src="getImageUrl(member.profilePicture)" :alt="member.username" class="member-avatar" />
                            <div class="member-info">
                                <div class="member-username">{{ member.username }}</div>
                                <div v-if="member.bio" class="member-bio">{{ member.bio }}</div>
                                <div v-if="member.location" class="member-location">
                                    <i class="bi bi-geo-alt"></i>
                                    {{ member.location }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Afficher le destinataire sélectionné si on est sur un profil -->
                <div v-if="id_user || pseudo_user" class="selected-recipient">
                    <label>Destinataire :</label>
                    <div class="recipient-info">
                        <img :src="selectedMember?.avatar || '/api/placeholder/36/36'" :alt="pseudo_user" />
                        <span>{{ pseudo_user }}</span>
                    </div>
                </div>
                
                <div class="message-input">
                    <label>Message initial :</label>
                    <textarea
                        v-model="textMessage"
                        rows="4"
                        placeholder="Écrivez votre message..."
                    ></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button @click="closePopup" class="btn-primary-outline">Annuler</button>
                <button
                    @click="sendMessage"
                    class="btn-primary"
                    :disabled="isButtonDisabled()"
                >
                    Envoyer 
                    <i class="bi bi-send"></i>
                </button>
            </div>
        </div>
    </div>
</template>
  
<script lang="ts">
import axios from 'axios';
import Cookies from "js-cookie";
import mssagingService from '@/services/messaging.service';
import { useRoute, useRouter } from "vue-router";
import { ref, computed } from 'vue';

// Définition et export des types
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
        const memberSearch = ref('');
        const memberSearchResults = ref<Member[]>([]);
        const selectedMember = ref<Member | null>(null);
        const textMessage = ref('');

        // Computed pour la désactivation du bouton
        function isButtonDisabled() {
            const hasMessage = textMessage.value.trim() !== '';
            const hasRecipient = selectedMember.value !== null || props.id_user !== null;
            return !hasMessage;
        };

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
                const responseAny = response as any;
                if (responseAny.users && Array.isArray(responseAny.users)) {
                    memberSearchResults.value = responseAny.users as Member[];
                } else if (responseAny.user) {
                    memberSearchResults.value = [responseAny.user] as Member[];
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
                (window as any).$func?.showToastError('Veuillez sélectionner un destinataire');
                return;
            }

            if (textMessage.value.trim() === '') {
                console.log('ERREUR: Message vide');
                (window as any).$func?.showToastError('Veuillez saisir un message');
                return;
            }
            console.log('=== DÉBUT sendMessage ===');
            console.log('textMessage:', textMessage.value);
            console.log('selectedMember:', selectedMember.value);
            console.log('props:', props);
            console.log('id_user:', props.id_user);
            

            console.log('Envoi du message:', {
                recipientId,
                message: textMessage.value,
                productId: props.id_post
            });

            mssagingService.startConversation({
                recipientId: recipientId,
                initialMessage: textMessage.value,
                productId: props.id_post ?? undefined, 
            }).then((response) => {
                console.log('Message envoyé avec succès:', response);
                (window as any).$func?.showToastSuccess('Message envoyé avec succès');
                closePopup();
            }).catch((error) => {
                console.error('Erreur lors de l\'envoi:', error);
                (window as any).$func?.showToastError('Erreur lors de l\'envoi du message');
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
.text_message, .btnSend {
    width: 100%;
}

/* Modal */
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
    padding: 20px; 
    box-sizing: border-box;
}

.modal {
    background: white;
    border-radius: 12px;
    width: 500px;
    max-width: calc(100vw - 40px); 
    max-height: calc(100vh - 40px); 
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    margin: auto;
    position: relative; 
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
    margin: 0;
    color: #212529;
    font-size: 20px;
}

.modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 24px;
    border-top: 1px solid #e9ecef;
    background: #f8f9fa;
    flex-shrink: 0;
}

/* Section de recherche de membres */
.search-member {
    margin-bottom: 20px;
}

.search-member label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #495057;
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
    padding: 12px 12px 12px 40px;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    outline: none;
    font-size: 14px;
    background: #f8f9fa;
    transition: all 0.2s;
}

.search-input input:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.search-results {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin-top: 8px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-result {
    display: flex;
    align-items: center;
    padding: 12px;
    cursor: pointer;
    border-bottom: 1px solid #f1f3f4;
    transition: background-color 0.2s, transform 0.2s;
    gap: 12px;
}

.member-result:last-child {
    border-bottom: none;
}

.member-result:hover {
    background-color: #f8f9fa;
    transform: translateX(4px);
}

.member-result.selected {
    background-color: #e3f2fd;
    border-left: 4px solid #2196f3;
    padding-left: 8px;
}

.member-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid #e9ecef;
}

.member-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.member-username {
    font-size: 14px;
    font-weight: 600;
    color: #212529;
    word-break: break-word;
}

.member-bio {
    font-size: 13px;
    color: #6c757d;
    line-height: 1.3;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.member-location {
    font-size: 12px;
    color: #868e96;
    display: flex;
    align-items: center;
    gap: 4px;
}

.member-location i {
    font-size: 11px;
}

/* Section destinataire sélectionné */
.selected-recipient {
    margin-bottom: 20px;
}

.selected-recipient label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #495057;
}

.recipient-info {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #e3f2fd;
    border: 1px solid #2196f3;
    border-radius: 8px;
}

.recipient-info img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-right: 12px;
    object-fit: cover;
}

.recipient-info span {
    font-size: 14px;
    font-weight: 500;
    color: #495057;
}

/* Section de message */
.message-input {
    width: 100%;
}

.message-input label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
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
    box-sizing: border-box;
}

.message-input textarea:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
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

/* Responsive */
@media (max-width: 768px) {
    .modal-overlay {
        padding: 10px;
    }
    
    .modal {
        width: 100%;
        max-width: none;
        max-height: calc(100vh - 20px);
        border-radius: 8px;
    }
    
    .modal-header,
    .modal-body,
    .modal-footer {
        padding: 16px;
    }
}
</style>
