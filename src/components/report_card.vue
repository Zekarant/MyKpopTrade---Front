<template>
    <!--------- Popup ---------->
    <div @click="close" class="popup-overlay">
        <div @click="$event.stopPropagation()" class="popup-content">
            <p v-if="type=='product'">Voulez-vous signaler cet article ?</p>
            <p v-if="type=='rating'">Voulez-vous signaler cet avis ?</p>
            <div class="inputReason">
                <label for="signalReason">Raison du signalement</label>
                <select class="select-primary" id="signalReason" v-model="signalReason">
                    <option value="inappropriate_content">contenu inapproprié</option>
                    <option value="offensive_language">langage offensant</option>
                    <option value="false_information">fausses informations</option>
                    <option value="spam">spam</option>
                    <option value="fraud">fraude</option>
                    <option value="copyright_violation">violation du droit d'auteur</option>
                    <option value="other">autre</option>
                </select>
            </div>
            <textarea class="inputReason" v-model="signalReasonTxt" type="text" placeholder="Expliquez-nous la raison du signalement"></textarea>
            <div class="popup-buttons-footer">
            <button style="border-radius: 2px; width: 100%;" class="btn btn-primary-outline" @click="close">Annuler</button>
            <button style="border-radius: 2px; width: 100%;" class="btn btn-danger" @click="report()">Signaler</button>
            </div>
        </div>
    </div>

</template>
  
  <script lang="ts">
    import { func } from '@/function';
    import axios from 'axios';
    import Cookies from "js-cookie";
    const PHPSESSID = Cookies.get('PHPSESSID');
    const API_URL = import.meta.env.VITE_API_URL;

    export default {

        name: "report_card",
        components: {
            
        },
        props: {
            type: {
                type: String,
                required: true
            },
            id: {
                type: String,
                required: true
            }
        },
        data() {
            return {
                signalReason: '',
                signalReasonTxt: ''

            };
        },
        methods: {
            close(){
                this.$emit('closeReport');
            },

           async report(){
                let data = {
                    'targetType': this.type,
                    'reason': this.signalReason,
                    'targetId': this.id,
                    'details': this.signalReasonTxt
                };
                try{
                    await axios.post(`${API_URL}/api/reports`, data, {
                        headers: {
                        Authorization: `Bearer ${PHPSESSID}`,
                        "Content-Type": "application/json"
                        }
                    }).then(response => {
                        console.log()
                        if (response.status === 200 || response.status === 201) {
                            func.showToastSuccess(response.data.message);
                            this.close();
                            return true;
                        } else {
                            func.showToastError(response.data.message);

                            return false;
                        }
                    }).catch(error => {
                        console.log(error);

                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"||error.response.status == 401){
                            func.verifSession();
                        
                        }
                        func.showToastError(error.response.data.message );

                        return false;
                
                    });

                }catch (error) {
                    console.error('Erreur lors de la modifcation du posts :', error);
                    throw error;
                }
                
           }
   
        },
    };

  </script>
  
  <style lang="scss" scoped>
    .inputReason{
        width: 100%;
        margin-bottom: 10px;
    }
    #signalReason{
        width: 100%;
    }
  </style>
  