<template>
    <div @click="closePopup" class="popup-overlay">
        <div @click="$event.stopPropagation()" class="popup-content send-message">
            <h4>Envoyer un message à {{ pseudo_user }}</h4>
            <br>
            <textarea class="text_message" name="text_message" id="text_message"  v-model="textMessage" @keyup="showSendBtn = true"></textarea>
            <button  v-if="textMessage" @click="sendMessage" class="btn-primary btnSend">Envoyer</button>

        </div>
    </div>
</template>
  
  <script lang="ts">
    import axios from 'axios';
    import Cookies from "js-cookie";
    import messagesService from '@/services/messages.js';
    import { useRoute, useRouter } from "vue-router";
    //import eventBus from '/eventBus'

    export default {

        name: "send_message",
   
        props: {
            pseudo_user: {
                type: String,
                required: true
            },
            id_user: {
                type: String,
                required: true,
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
            return { route, router };
        },
        mounted() {
            console.log(this.id_user)
        },
        methods: {
            closePopup() {
                this.$emit('closeSendMessage'); // Émet un événement pour fermer la popup
            },
            sendMessage(){
                messagesService.createConversation(this.id_user, this.id_post, this.textMessage).then((response) => {
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
    .text_message, .btnSend{
        width: 100%;
    }

  </style>
