<template>
    <div @click="closePopup" class="modal-overlay">
        <div @click="$event.stopPropagation()" class="modal">
            <div class="modal-header">
                <h2>Nouvelle conversation</h2>
                <button class="close-btn" @click="closePopup">&times;</button>
            </div>
            <div class="modal-body">
                <div class="search-member">
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
                            <img :src="member.avatar || '/api/placeholder/36/36'" :alt="member.username" />
                            <span>{{ member.username }}</span>
                        </div>
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
                    :disabled="textMessage.trim() === '' || (!selectedMember && !id_user)"
                    class="btn-primary"
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
import userService from '@/services/user.service'
import { useRoute, useRouter } from "vue-router";
import { ref } from 'vue';

// Définition des types
interface Member {
    _id?: string;
    id?: string;
    username: string;
    avatar?: string;
}

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
    
    data() {
        return {
            showSendBtn: false,
            textMessage: '',
        };
    },
    
    setup() {
        const route = useRoute();
        const router = useRouter();
        const memberSearch = ref('');
        const memberSearchResults = ref<Member[]>([]);
        const selectedMember = ref<Member | null>(null);

        return { 
            route, 
            router, 
            memberSearch, 
            memberSearchResults, 
            selectedMember 
        };
    },
    
    mounted() {
        console.log(this.id_user);
        // Si on a déjà un utilisateur ciblé, on peut le pré-sélectionner
        if (this.id_user && this.pseudo_user) {
            this.selectedMember = {
                _id: this.id_user,
                username: this.pseudo_user
            } as Member;
        }
    },
    
    methods: {
        async searchMembers() {
            if (this.memberSearch.length < 2) {
                this.memberSearchResults = [];
                return;
            }

            try {
                const response = await userService.getUserByName(this.memberSearch);
                // Si le service retourne un seul utilisateur dans 'user'
                this.memberSearchResults = response.user ? [response.user] as Member[] : [];
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
                this.memberSearchResults = [];
            }
        },
        
        selectMember(member: Member) {
            this.selectedMember = member;
            this.memberSearch = member.username;
            this.memberSearchResults = [];
        },
        
        closePopup() {
            this.$emit('closeSendMessage');
        },
        
        sendMessage() {
            // Déterminer le destinataire
            const recipientId = this.selectedMember?._id || this.selectedMember?.id || this.id_user;
            
            if (!recipientId) {
                this.$func.showToastError('Veuillez sélectionner un destinataire');
                return;
            }

            mssagingService.startConversation({
                recipientId: recipientId,
                initialMessage: this.textMessage,
                productId: this.id_post ?? undefined, 
            }).then((response) => {
                this.$func.showToastSuccess('Message envoyé avec succès');
                this.closePopup();
            }).catch((error) => {
                console.error(error);
                this.$func.showToastError('Erreur lors de l\'envoi du message');
            });
        }
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
    flex: 1; /* Permet au body de prendre l'espace disponible */
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 24px;
    border-top: 1px solid #e9ecef;
    background: #f8f9fa;
    flex-shrink: 0; /* Empêche le footer de se réduire */
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
    padding: 12px 12px 12px 40px; /* Espace pour l'icône */
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
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin-top: 8px;
    background: white;
}

.member-result {
    display: flex;
    align-items: center;
    padding: 12px;
    cursor: pointer;
    border-bottom: 1px solid #f1f3f4;
    transition: background-color 0.2s;
}

.member-result:last-child {
    border-bottom: none;
}

.member-result:hover {
    background-color: #f8f9fa;
}

.member-result.selected {
    background-color: #e3f2fd;
    border-color: #2196f3;
}

.member-result img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-right: 12px;
    object-fit: cover;
}

.member-result span {
    font-size: 14px;
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