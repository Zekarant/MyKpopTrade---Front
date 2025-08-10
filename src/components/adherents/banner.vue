<template>
    <div @click="closeMenu" class="content">
        <div v-if="admin" class="background" @click="triggerFileInputBanner">
            <img v-if="profilInfo.profileBanner" :src="banneerictureUrl || undefined" alt="Banner Picture" />
            <div v-else class="background"></div>
            <i  v-if="profilInfo.profileBanner" @click="deletePicturePopup($event,'banner')" style="position: absolute; right: 5px; bottom: 0px; color: white; background: #0000005c; border-radius: 4px; cursor: pointer;"  class="bi bi-trash"></i>
            <input type="file" ref="fileInputbanner" @change="updatePictureBanner" accept="image/*" style="display: none;" />
        </div>
        <div v-else class="background">
            <img v-if="profilInfo.profileBanner" :src="banneerictureUrl || undefined" alt="Banner Picture" />
            <div v-else class="background"></div>
        </div>

        <div @click="triggerFileInput"  v-if="admin" class="picture">
            <img v-if="profilInfo.profilePicture && profilInfo.profilePicture  != 'https://mykpoptrade.com/images/avatar-default.png'" :src="profilePictureUrl || undefined" alt="Profile Picture" />
            <div v-else class="empty-profile">
                <i class="bi bi-camera"></i>
            </div>
            <i  v-if="profilInfo.profilePicture && profilInfo.profilePicture  != 'https://mykpoptrade.com/images/avatar-default.png'" @click="deletePicturePopup($event,'profil')" style="position: absolute; right: 0px; bottom: 0px; color: white; background: #0000005c; border-radius: 4px; cursor: pointer;"  class="bi bi-trash"></i>
            <input type="file" ref="fileInput" @change="updatePicture" accept="image/*" style="display: none;" />
        </div>
        <div  v-else class="picture">
            <img v-if="profilInfo.profilePicture && profilInfo.profilePicture  != 'https://mykpoptrade.com/images/avatar-default.png'" :src="profilePictureUrl || undefined" alt="Profile Picture" />           
            <div v-else class="empty-profile">
                <i class="bi bi-camera"></i>
            </div>
        </div>
        <div class="profil">
            <div class="row row_profil" style="height: 100%; ">
                <div class="empty_box"></div>
                <div class="row row_name">
                    <div class="container_nickname col-md-4">
                        <div class="nickname">
                            <div class="nickname_block">
                                <span class="nickname_text_field">{{ profilInfo.username }}</span>
                            </div>
                            <div v-if="profilInfo.isSellerVerified" class="img_certif_container">
                                <img src="@/assets/images/certif.svg">
                            </div>
                        </div>
                        <div class="identifier">@{{ profilInfo.username }}</div>
                    </div>
                    <div class="container_infos col-md-7">
                        <div class="row">
                            <div class="col-md-5 subscription">
                                <span class="bold">00</span> Abonnements
                            </div>
                            <div class="col-md-5 subscription">
                                <span class="bold">00</span> Abonnés

                            </div>
                            <div v-if="admin" class="col-md-1 more_content" @click="toggleMenu($event)">
                                <i class="bi bi-three-dots-vertical"></i>
                                <div v-if="isMenuVisible" class="dropdown-menu">
                                    <ul >
                                        <li @click="openSettings">
                                            <i class="bi bi-gear me-2"></i> Paramètres
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <br>
                        <div class="row">
                            <div class="col-md-7">
                                <button @click="openMessagePopup" v-if="!isYouProfil" style="font-size: 12px;" type="button" class="btn btn-outline">Envoyer un message</button>
                            </div>
                            <div class="col-md-5">
                                <button v-if="!isYouProfil" style="font-size: 12px;" type="button" class="btn btn-primary">Suivre</button>
                            </div>
                        </div>
                    </div>
                    <div class="container_infos col-md-1"></div>
                </div>

            </div>
        </div>
    </div>

    
    <!--------- Popup Pour envoyer un message ---------->
    <send_message :id_user="profilInfo.id" :pseudo_user="profilInfo.username" @closeSendMessage="openMessagePopup" v-if="popupMessage"></send_message>
    <!--------- Popup Supression ---------->
    <div v-if="showDeletePictureConfirmation || showDeletePictureBannerConfirmation" @click="closePopup()" class="popup-overlay">
        <div @click="$event.stopPropagation()" class="popup-content">
            <p>Voulez-vous vraiment supprimer votre photo ?</p>
            <div class="popup-buttons-footer">
                <button class="btn btn-primary-outline" @click="deletePicturePopup($event, 'null')">Annuler</button>
                <button v-if="showDeletePictureConfirmation" class="btn btn-danger" @click="confirmDeletePicture">Supprimer</button>
                <button v-if="showDeletePictureBannerConfirmation" class="btn btn-danger" @click="confirmDeleteBanner">Supprimer</button>
            </div>
        </div>
    </div>
    <div v-if="showDeletePaypalPopup" @click="closePopup()" class="popup-overlay">
        <div @click="$event.stopPropagation()" class="popup-content">
            <p>Voulez-vous vraiment supprimer cet email Paypal ?</p>
            <div class="popup-buttons-footer">
                <button class="btn btn-primary-outline" @click="closePopup()">Annuler</button>
                <button class="btn btn-danger" @click="deletePaypal">Supprimer</button>
            </div>
        </div>
    </div>
        <!--------- Popup Paramètre ---------->
        <div v-if="showSetting" class="popup-overlay" @click="closePopup()">
            <div @click="$event.stopPropagation()" style="width: 500px;" class="popup-content">
                <i style="float: right;" @click="closePopup()" class="bi bi-x-lg display_phone_tablette"></i>
                <div style="position: relative;">
                    <div class="setting_item"   @click="changePswdPopup()">Changer le mot de passe <i class="bi bi-chevron-compact-right chevron-setting"></i></div>
                    <div class="setting_item"  @click="getVerifIdentityState">
                        <span>Identité vérifiée</span>
                        <i style="zoom: 1.5; vertical-align:sub;" v-if="profilInfo.isIdentityVerified" class="bi bi-check-lg valid"></i>
                        <i style="zoom: 1.5; vertical-align:sub; color:red; margin-left: 10px;" v-else-if="profilInfo.verificationLevel == 'none'" class="bi bi-x-lg"></i>
                        <i v-if="!profilInfo.isIdentityVerified" class="bi bi-chevron-compact-right chevron-setting"></i>
                    </div>
                    <div class="setting_item">
                        <span>Email vérifié </span>
                        <span v-if="emailRequest" class="emailRequestSuccess">Email de vérification envoyé</span>  
                        <button @click="verifEmail()" class="btn-primary btnRequestEmail" v-else-if="!profilInfo.isEmailVerified && !emailRequest">Vérifier l'email</button>
                        <i style="zoom: 1.5; vertical-align:sub;" v-if="profilInfo.isEmailVerified" class="bi bi-check-lg valid"></i>
                    </div>

                    <div class="setting_item" style="display:flex;align-items: center;">
                        <span>Téléphone</span> 
                        <div style="display: flex;"  >
                            <i v-if="profilInfo.isPhoneVerified || codeRequest"  style="zoom: 1.5; vertical-align:sub; margin-right: 10px;" class="bi bi-check-lg valid"></i>
                            <input v-if="!telRequest || codeRequest" type="tel" style="margin-left: 10px;" id="phone" @input="isBtnSaveTelVisible=true" v-model="phoneNumber" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">
                            
                            <button @click="saveTel" class="btn-primary btnRequestPhone" v-if="isBtnSaveTelVisible">Enregistrer</button>                   
                        </div>
                        <div class="telRequestSuccess" v-if="telRequest && !codeRequest">
                            <span >Veuillez entrer le code :</span>
                            <div>
                                <input placeholder="code" v-model="phoneCode" type="number"> 
                                <button @click="verifCodeTel()" class="btn-primary btnRequestTel" >Vérifier le téléphone</button>
                            </div>

                        </div> 
                        <button v-else-if="!profilInfo.isPhoneVerified && !telRequest && phoneNumber && !isBtnSaveTelVisible && !codeRequest" @click="verifTel()" class="btn-primary btnRequestTel" >Vérifier le téléphone</button>

    
                    </div>
                    <div class="setting_item" style="display:flex;align-items: center;">
                        <span style="margin-right: 10px;">Email Paypal</span> 
                        <div style="display: flex;">
                            <input @input="saveMailPaypal = true" type="email" id="phone" v-model="emailPaypal">    
                            <div style="position: absolute; right: 15px;">
                                <button @click="savePaypal" class="btn-primary btnRequestEmail" v-if="saveMailPaypal">Enregistrer</button>                   
                                <button @click="showDeletePaypalPopup = true; showSetting = false" class="btn-danger btnRequestEmail" v-if="profilInfo.paypalEmail">Supprimer</button>   
                            </div>   
                            
                        </div>

                    </div>
                    <div class="setting_item">
                        <span>
                            Autoriser les messages directs
                        </span>
                        <label class="switch">
                            <input @change="changeAllowDirectMessages" type="checkbox" v-model="profilInfo.preferences.allowDirectMessages">
                            <span class="slider"></span>
                        </label>
                        
                    </div>
                    <div class="setting_item">
                        <button style="width: 100%;" class="btn-primary-outline" @click="exportUserData">Exporter mes données</button>
                    </div>
                    <div class="setting_item" v-if="!profilInfo.anonymized">
                        <button style="width: 100%;" class="btn-primary-outline" @click="anonymizePopup = true">Anonymiser mes données</button>
                    </div>                    
                    <div v-if="profilInfo.accountStatus = 'active'" class="setting_item">
                        <button style="width: 100%;" class="btn-danger" @click="showDeleteAccount = true">Supprimer votre compte</button>
                    </div>
                    <!--<button class="btnSave btn btn-primary" v-if="isBtnSaveVisible" @click="saveSettings">Enregistrer</button>   -->               

                </div>
                
            </div>
        </div>
        <!--------- Popup changer mdp ---------->
        <div v-if="showSettingPswd" class="popup-overlay" @click="closePopup()">
            <div @click="$event.stopPropagation()" style="width: 500px;" class="popup-content">
                <i style="float: right;" @click="closePopup()" class="bi bi-x-lg display_phone_tablette"></i>
                <h5 style="margin-bottom: 20px;">Changer votre mot de passe</h5>
                <div style="margin-bottom: 20px;">
                    <input type="password" v-model="currentPassword" placeholder="Ancien mot de passe" class="form-control mb-2">
                    <input type="password" v-model="newPassword" placeholder="Nouveau mot de passe" class="form-control mb-2">
                    <input type="password" v-model="confirmPassword" placeholder="Confirmer le mot de passe" class="form-control mb-2">
                </div>
                <button class="btnSave btn btn-primary" @click="saveSettingsPswd">Changer votre mot de passe</button>                  

            </div>
            
        </div>
        <!--------- Popup anonymiser les données ---------->
        <div v-if="anonymizePopup" class="popup-overlay" @click="closePopup()">
            <div @click="$event.stopPropagation()" style="width: 500px;" class="popup-content">
                <i style="float: right;" @click="closePopup()" class="bi bi-x-lg display_phone_tablette"></i>
                <h5 style="margin-bottom: 20px;">Voulez-vous anonymiser vos données ?</h5>
                <div style="display: flex;">
                    <button style="margin: 10px;" class="btn btn-primary-outline" @click="anonymizePopup = false">Annuler</button>                  
                    <button style="margin: 10px;" class="btn btn-primary" @click="confirmAnonymize">Confirmer</button>  
                </div>
                

            </div>
            
        </div>
        <!--------- Popup supprimer compte ---------->
        <div v-if="showDeleteAccount" class="popup-overlay" @click="closePopup()">
            <div @click="$event.stopPropagation()" style="width: 500px;" class="popup-content">
                <i style="float: right;" @click="closePopup()" class="bi bi-x-lg display_phone_tablette"></i>
                <h5 style="margin-bottom: 20px;">Veuillez entrer votre mot de passe pour confimer la suppression</h5>
                <div style="margin-bottom: 20px;">
                    <input type="password" v-model="passwordForConfirm" placeholder="mot de passe" class="form-control mb-2">
                </div>
                <div style="display: flex;">
                    <button style="margin: 10px;" class="btnSave btn btn-danger-outline" @click="showDeleteAccount = false">Annuler</button>                  
                    <button style="margin: 10px;" class="btnSave btn btn-danger" @click="requestAccountDeletion">Supprimer le compte</button>      
                </div>
            </div>
            
        </div>
        <!--------- Popup vérifier identitée ---------->
        <div v-if="verifIdentityPopup" class="popup-overlay" @click="closePopup()">
            <div @click="$event.stopPropagation()" style="width: 500px;" class="popup-content">
                <i style="float: right;" @click="closePopup()" class="bi bi-x-lg display_phone_tablette"></i>
                <div v-if="!verification"><!-- Si aucune demande en cours -->
                    <select class="select-primary" v-model="documentType" name="documentType" id="documentType">
                        <option value="id_card">Carte d'identitée</option>
                        <option value="passport">Passport</option>
                        <option value="driver_license">Permis de conduire</option>
                    </select>
                    <div class="file-input-container" @click="triggerFileInputIdentity">
                        <img v-if="!pictureDocumentPreview" style="height: 150px; " 
                        class="imgcenter" src="../../assets/images/camera-white.svg" >
                        <img v-else style="height: 150px; " 
                        class="imgcenter" :src="pictureDocumentPreview" >
                        <input style="display: none;" ref="fileInputIdentity" type="file" accept="image/*"  @change="updatePictureDocument"  />
                    </div>
                    <label style="margin-top: 10px;" for="terms">J'autorise le traitement de mes données</label>
                    <input style="margin-left: 5px; vertical-align: sub;" class="cheeckbox-primary" v-model="consentUseData" type="checkbox" id="terms" required>
                    <button style="margin-top: 10px;"  v-if="consentUseData && documentIamge"  class="btn btn-primary imgcenter" @click="verifIdentity">Vérifier mon identitée</button>      
                </div>
                <div v-else>
                    <div v-if="!verification.userVerification.isVerified && verification.verification. status == 'pending'">
                        <div style="text-align: center; margin-bottom: 5px;">
                            Demande soumise le {{ formatDate(verification.verification.submittedAt) }}
                        </div>
                        <button class="btn btn-primary-outline" @click="stopVerifIdentity">
                            Annuler la demande
                        </button>
                    </div>
                    <div v-else-if="verification.verification.status == 'rejected'">
                        <div style="text-align: center; margin-bottom: 5px; font-weight: bold; color: var(--danger-color);">
                            Demande rejetée : {{ verification.verification.rejectionReason }}
                        </div>
                        <button class="btn btn-danger-outline" @click="verification=null">
                            Renvoyer une demande
                        </button>
                    </div>
                </div>
                

            </div>

            
        </div>
        
</template>


<script lang="ts">
    import { useRoute, useRouter } from "vue-router";
    import axios from 'axios';
    import Cookies from "js-cookie";
    import { PDFExportService } from '../../services/PDFExportService.service';
    import send_message from './send_message.vue';
    export default {
        name: "banner",
        data() {
            return {
                modify: false,
                isYouProfil: false,
                isMenuVisible: false,
                verifIdentityPopup: false,
                showDeletePictureConfirmation: false, 
                showDeletePictureBannerConfirmation: false,
                showSetting: false,
                showSettingPswd: false,
                emailRequest: false,
                telRequest: false,
                codeRequest: false,
                isBtnSaveVisible:false,
                isBtnSaveTelVisible: false,
                showDeleteAccount: false,
                anonymizePopup:  false,
                anonymize:  false,
                saveMailPaypal:  false,
                consentUseData: false,
                showDeletePaypalPopup: false,
                documentIamge: null as File | null,
                pictureDocumentPreview: '',
                phoneNumber: "",
                emailPaypal: "",
                phoneCode: "",
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                passwordForConfirm: '',
                documentType:'id_card', // Type de document pour la vérification d'identité
                verification: null as any,
                popupMessage: false,

            };
        },
        components: {
            send_message,
          
        },
        setup() {
            const route = useRoute();
            const router = useRouter();
            return {
                route,
                router,
            };
        },
        mounted() {
            const id = this.route.params.id; // Récupère l'ID passé en paramètre
            //récupérer l'id dans l'url et vérifier l'id de l'user si est pareille que l'id en session 
            if(id == 'me'){
                this.isYouProfil = true;
            }
           
        },

        methods: {
            toggleMenu(event: Event){
                event.stopPropagation();
                this.isMenuVisible = !this.isMenuVisible;
            },
            triggerFileInputIdentity() {
                (this.$refs.fileInputIdentity as HTMLImageElement)?.click();
            },
            closeMenu(){
                this.isMenuVisible = false;
            },
            formatDate(dateString: String) {
                if (!dateString) return '';
                const date = new Date(dateString.toString());
                return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
                });
            },
            closePopup(){
                this.showDeletePictureConfirmation = false;
                this.showDeletePictureBannerConfirmation = false;
                this.showSetting = false;
                this.showSettingPswd = false;
                this.showDeleteAccount = false;
                this.verifIdentityPopup = false;
                this.anonymizePopup = false;
                this.showDeletePaypalPopup = false;
                
            },
            openSettings(){
                this.phoneNumber = this.profilInfo.phoneNumber || '';
                this.emailPaypal = this.profilInfo.paypalEmail || '';
                this.showSetting = true;
            },
            triggerFileInput() {
                const fileInput = this.$refs.fileInput as HTMLInputElement;
                fileInput.click();
            },
            triggerFileInputBanner() {
                const fileInput = this.$refs.fileInputbanner as HTMLInputElement;
                fileInput.click();
            },
            async updatePictureBanner(event: Event) {
                const file = (event.target as HTMLInputElement).files?.[0];
          
                if (file) {
                    var formData = new FormData();

                    formData.append('profileBanner', file);

                    const sessionToken = Cookies.get('sessionToken');
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/me/banner`, formData, {
                        headers: {
                        'Content-Type': 'multipart/form-data.',
                        'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                        }
                    }).then(response => {

                        if (response.status === 200) {
                            this.profilInfo.profileBanner = response.data.profileBanner;

                        }
                    }).catch(error => {
                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                            this.$func.verifSession();
                        }
                        console.log(error);
                    });
                }
            },
            async updatePicture(event: Event) {
                const file = (event.target as HTMLInputElement).files?.[0];
          
                if (file) {
                    console.log(file);

                    var formData = new FormData();

                    formData.append('profilePicture', file);
                    console.log('Contenu de FormData :', Array.from(formData.entries()));
                    const sessionToken = Cookies.get('sessionToken');
                    console.log(formData);
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/me/picture`, formData, {
                        headers: {
                        'Content-Type': 'multipart/form-data.',
                        'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                        }
                    }).then(response => {

                    if (response.status === 200) {
                        this.profilInfo.profilePicture = response.data.profilePicture;

                    }
                    }).catch(error => {
                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                            this.$func.verifSession();
                        }
                        console.log(error);
                    });
                }
            },
            editProfile() {
                this.modify = true;
            },
            deletePicturePopup(event: Event,type: string) {
                event.stopPropagation();
                if(type == 'null'){
                    this.showDeletePictureConfirmation = false;
                    this.showDeletePictureBannerConfirmation = false;
                }else if(type == 'banner'){
                    this.showDeletePictureBannerConfirmation = !this.showDeletePictureBannerConfirmation;
                }else if(type == 'profil'){
                    this.showDeletePictureConfirmation = !this.showDeletePictureConfirmation;
                }
            },
            confirmDeleteBanner(){
                const sessionToken = Cookies.get('sessionToken');
                axios.delete(`${import.meta.env.VITE_API_URL}/api/profiles/me/banner`, {
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`,
                    },
                }).then(() => {
                    this.profilInfo.profileBanner = null;
                    this.showDeletePictureBannerConfirmation = false; 
                })
                .catch((error) => {
                    console.error(error);
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }
                });
            },
            confirmDeletePicture() {
                const sessionToken = Cookies.get('sessionToken');
                axios.delete(`${import.meta.env.VITE_API_URL}/api/profiles/me/picture`, {
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`,
                    },
                }).then(() => {
                    this.profilInfo.profilePicture = null; // Supprime localement l'image
                    this.showDeletePictureConfirmation = false; // Ferme la boîte de dialogue
                })
                .catch((error) => {
                    console.error(error);
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();

                    }
                });
            },
            async getVerifIdentityState(){
                if(!this.profilInfo.isIdentityVerified){
                    this.verifIdentityPopup = true;
                    try {
                        const sessionToken = Cookies.get('sessionToken');
                        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/verification/identity/status/`, {
                            headers: {
                                'Authorization': `Bearer ${sessionToken}`
                            }
                        });
                        console.log(response.data.message);
                        console.log(response.status);
                        console.log(response.data.code);
                        if (response.status === 200) {
                            this.verification = response.data;
                        }else{
                            if(response.data.message == "Token invalide" || response.data.code == "TOKEN_EXPIRED"){
                                this.$func.verifSession();
                            }
                        }
                    } catch (error) {
                        if (axios.isAxiosError(error) && error.response) {
                            if(error.response.status === 404){
                                this.verification = null;
                            }
                        } else {
                            console.log(error);
                        }

                    }
                }
            },
            stopVerifIdentity(){
                const sessionToken = Cookies.get('sessionToken');
                axios.delete(`${import.meta.env.VITE_API_URL}/api/verification/identity/cancel`, {
                    headers: {
                    'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                    }
                }).then(response => {

                    if (response.status === 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.verifIdentityPopup = false;
                        this.showSetting = true;
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }
                    this.$func.showToastError(error.response.data.message);

                });
            },
            verifIdentity(){
                const sessionToken = Cookies.get('sessionToken');
                var data = new FormData();
                data.append('documentType',  this.documentType);
                data.append('consentGiven',  String(this.consentUseData));
                if (this.documentIamge) {
                    data.append('document', this.documentIamge);
                }
                axios.post(`${import.meta.env.VITE_API_URL}/api/verification/identity`, data, {
                    headers: {
                    'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                    }
                }).then(response => {

                    if (response.status === 201) {
                        this.verifIdentityPopup = false;
                        this.showSetting = true;
                        this.$func.showToastSuccess(response.data.message);
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }
                    this.$func.showToastError(error.response.data.message);

                });
            },
            async verifEmail(){
    
                const sessionToken = Cookies.get('sessionToken');
                await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, {
                    email: this.profilInfo.email,
                }, {
                    headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                    }
                }).then(response => {

                    if (response.status === 200) {
                        this.emailRequest = true;
                        this.$func.showToastSuccess(response.data.message);

                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }
                });
            
            },
            async verifTel(){
    
                const sessionToken = Cookies.get('sessionToken');
                await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-phone-verification`, {
                    phoneNumber: this.phoneNumber,
                }, {
                    headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                    }
                }).then(response => {

                    if (response.status === 200) {
                        this.telRequest = true;
                        this.$func.showToastSuccess(response.data.message);

                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }
                });
            
            },
            async verifCodeTel(){
                const sessionToken = Cookies.get('sessionToken');
                await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-phone`, {
                    code: String(this.phoneCode),
                }, {
                    headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                    }
                }).then(response => {

                    if (response.status === 200) {
                        this.codeRequest = true;
                    
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }
                });
            },
            async changeAllowDirectMessages() {
                const sessionToken = Cookies.get('sessionToken');

                await axios.put(`${import.meta.env.VITE_API_URL}/api/profiles/me`, 
                {
                    preferences: {
                        allowDirectMessages: this.profilInfo.allowDirectMessages
                    },
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                        }
                }).then(response => {
                        console.log(response);
                        if (response.status === 200) {
                            this.$func.showToastSuccess(response.data.message);
                            //Sucess Message
                        }
                    }).catch(error => {
                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                            this.$func.verifSession();
                        }
                    });
            },
            changeSettings(){
                this.isBtnSaveVisible = !this.isBtnSaveVisible;
            },
            saveTel(){
                const sessionToken = Cookies.get('sessionToken');

                axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, 
                {
                    phoneNumber: this.phoneNumber
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                        }
                }).then(response => {
                    if (response.status === 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.isBtnSaveTelVisible = false;
                        this.telRequest = false;
                        this.codeRequest = false;
                        this.phoneCode = '';
                        this.profilInfo.isPhoneVerified = false; // Met à jour l'état de vérification du téléphone
                
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }
                });
            },
            changePswdPopup(){
                this.showSetting = false
                this.showSettingPswd = true
            },
            async saveSettingsPswd(){
                const sessionToken = Cookies.get('sessionToken');

                await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/update-password`, 
                {
                    currentPassword: this.currentPassword,
                    newPassword: this.newPassword,
                    confirmPassword: this.confirmPassword
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                        }
                }).then(response => {
                    console.log(response);
                    if (response.status === 200) {
                        this.showSettingPswd = false;
                        this.showSetting = true;
                        this.$func.showToastSuccess(response.data.message);

                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }else{
                        this.$func.showToastError(error.response.data.message);
                    }
                });
            
            }, 
            async exportUserData() {
                const sessionToken = Cookies.get('sessionToken');
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me/data-export`, {
                        headers: {
                            'Authorization': `Bearer ${sessionToken}`
                        }
                    });
                    // Création du blob et téléchargement
                    const dataStr = JSON.stringify(response.data, null, 2);
                    const pdfExporter = new PDFExportService();
                    const sections = [
                        { key: 'user', label: 'Informations Utilisateur', color: [46, 125, 50] },
                        { key: 'products', label: 'Posts/Articles', color: [231, 76, 60] },
                        { key: 'orders', label: 'Commandes/Achats', color: [155, 89, 182] },
                        { key: 'messages', label: 'Messages/Conversations', color: [52, 152, 219] },
                        { key: 'favorites', label: 'Favoris/Liste de souhaits', color: [241, 196, 15] },
                        { key: 'reviews', label: 'Avis/Evaluations', color: [230, 126, 34] },
                        { key: 'settings', label: 'Parametres/Preferences', color: [149, 165, 166] }
                    ];
                    pdfExporter.createPDF(response.data,'MyKPopTrade - Export des Données',sections);

                    /*const blob = new Blob([dataStr], { type: "application/json" });
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'export-mykpoptrade.json';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);*/
                } catch (error) {
                    this.$func.showToastError("Erreur lors de l'export des données.");
                    console.error(error);
                }
            },
            requestAccountDeletion() {
                const sessionToken = Cookies.get('sessionToken');
                axios.delete(`${import.meta.env.VITE_API_URL}/api/auth/delete-account`, {
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`
                    },data: {
                        password: this.passwordForConfirm  
                    }
                }).then(response => {
                    this.$func.showToastSuccess(response.data.message);
                    this.showDeleteAccount = false;
                    this.$func.logout();
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }else{
                        this.$func.showToastError(error.response.data.message);
                    }
                    this.showDeleteAccount = false;

                });
            },
            confirmAnonymize(){
                const sessionToken = Cookies.get('sessionToken');
                axios.post(`${import.meta.env.VITE_API_URL}/api/users/me/anonymize`, {
                    "confirmation": true
                }, {
                    headers: {
                        'Authorization': `Bearer ${sessionToken}` 
                    }
                }).then(response => {
                    this.$func.showToastSuccess(response.data.message);
                    this.anonymizePopup = false;

            
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }else{
                        this.$func.showToastError(error.response.data.message);
                    }
                });
            },
            deletePaypal(){
                const sessionToken = Cookies.get('sessionToken');

                axios.delete(`${import.meta.env.VITE_API_URL}/api/auth/profile/paypal-email`, 
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token
                    },
                    data: {
                        paypalEmail: this.emailPaypal
                    }
                }).then(response => {
                    if (response.status === 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.saveMailPaypal = false;
                        this.emailPaypal = '';
                        this.profilInfo.paypalEmail = '';
                        this.showDeletePaypalPopup = false;

                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }else{
                        this.$func.showToastError(error.response.data.message);
                        this.saveMailPaypal = false;
                    }
                });
            },
            savePaypal(){
                
                const sessionToken = Cookies.get('sessionToken');

                axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile/paypal-email`, 
                {
                    paypalEmail: this.emailPaypal
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}` // Ajout du Bearer Token

                    }
                }).then(response => {
                    console.log(response);
                    if (response.status === 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.saveMailPaypal = false;
                        this.profilInfo.paypalEmail = this.emailPaypal;
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.verifSession();
                    }else{
                        this.$func.showToastError(error.response.data.message);
                        this.saveMailPaypal = false;
                    }
                });
            },
            updatePictureDocument(event: Event) {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) {
                    this.documentIamge = file;
                    const reader = new FileReader();
       
                    reader.onload = (e) => {
                        if (e.target?.result) {
                            this.pictureDocumentPreview =  e.target.result as string;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            },
            openMessagePopup(){
                this.popupMessage = !this.popupMessage;
            },
         
        },
        computed: {
            profilePictureUrl() {
                if(this.profilInfo.profilePicture == 'https://mykpoptrade.com/images/avatar-default.png'){
                    return 'https://mykpoptrade.com/images/avatar-default.png';
                }else{
                const baseUrl = import.meta.env.VITE_API_URL; // Récupère le nom de domaine depuis les variables d'environnement
                return this.profilInfo.profilePicture
                ? `${baseUrl}${this.profilInfo.profilePicture}`
                : null;
                }
          
            },
            banneerictureUrl() {
                const baseUrl = import.meta.env.VITE_API_URL; // Récupère le nom de domaine depuis les variables d'environnement
                return this.profilInfo.profileBanner
                ? `${baseUrl}${this.profilInfo.profileBanner}`
                : null;
          
            },
        },
        props: {
            profilInfo: {
                type: Object,
                required: true,
            },
            admin: {
                type: Boolean,
                default: false,
            }
        },

    };

</script>
<style lang="scss" scoped>
.btn{
    border-radius: 2px;
    width: 100%;
}
.content{
    height:100%;
    border-bottom: 0.5px solid var(--secondary-color-tint)
}
.profil{
    height:100%;
}
.background{
    background: var(--primary-color);
    width:100%;
    max-width: 100vw;
    height:50%;
    position: relative;
}
.background img{
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.picture{
    height: 130px;
    width: 130px;
    background: var(--primary-color);
    border-radius: 4px;
    border: 4px solid white;
    position: absolute;
    top: 15%;
    left: 30%;
}
.picture img{
    height: 100%;
    width: 100%;
    object-fit: cover;
}
.empty-profile {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.empty-profile i {
  font-size: 3rem; /* Ajustez la taille de l'icône */
  color: white; 
}
.empty_box{
   width: calc(30% + 40px);
   height:100%;
   margin:0px;
   padding:0px
}
.row_name{
    width:calc(70% - 40px);
    height:100%;
    margin:0px;
    padding:0px;
    padding-top: 5px;
}
.container_infos{

}
.nickname_block{
    display: inline-block;
}
.img_certif_container{
    display: inline-block;
    width: 10px;
}
.img_certif_container img{
    width: 100%;
}
.nickname_text_field{
    font-weight: 700;
    font-family: "Sora", serif;
    color: var(--primary-color);
    font-size: large;
    margin-right: 2px;
}
.identifier{
    font-family: "Sora", serif;
    /*font-size: 10px;*/
    font-size: small;
    font-weight: 400;
    line-height: 12.6px;
    text-align: left;
    text-decoration-skip-ink: none;
    color: var(--primary-color);

    
}
button.btn.btn-outline {
    color: var(--blue);
    border-color: var(--blue);
}
button.btn.btn-outline:hover {
    background-color: var(--blue);
    color: white;
}
.subscription{
    font-family: "Sora", serif;
    color: var(--secondary-color-shade);
    font-size: small;
    text-align: right;
}
.subscription .bold{
    color: var(--primary-color);
}
.more_content {
  position: relative;
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: 20px;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  width: 150px;
  display: block;
}

.dropdown-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.dropdown-menu li {
  padding: 10px;
  cursor: pointer;
  font-size: 12px;
  color: var(--primary-color);
}

.dropdown-menu li:hover {
  background-color: var(--secondary-color-tint);
}
.valid, .emailRequestSuccess{
    color: var(--success-color);
    margin-left: 15px;
}
.valid, .telRequestSuccess{
    color: var(--success-color);
    margin-left: 15px;
}
.btnRequestEmail{
    font-size: small;
    padding: 4px;margin-left: 5px;
}
.btnRequestPhone{
    font-size: small;
    padding: 4px;
    position: absolute;
    right: 15px;
}
.btnRequestTel{
    font-size: small;
    padding: 4px;
    position: absolute;
    right: 15px;
}
.btnSave{
    margin-top:10px
}
.file-input-container {
    margin-top: 10px;
    border: dashed 2px var(--secondary-color);
    background: rgb(221, 221, 221);
    cursor: pointer;
}
.chevron-setting{
    zoom: 1.3; 
    vertical-align:sub; 
    position: absolute; 
    right: 15px;
}
.setting_item{
    margin-top: 10px;
}
@media (max-width: 768px) {
    .picture{
        top: 15%;
        left: calc(calc(100% - 130px) / 2) !important;
    } 
    .empty_box{
        display: none;
    }
    .background{
        height: 15vh;
    }
    .profil{
        position: relative;
        width: 100vw;
        padding-top: calc(calc(130px + 5%) / 2);
    }
    .row_profil{
        height: auto !important;
        width: 100vw !important;
    }
    .row_name{
        width: 100%;
    }
  
    .row-banner{
        width: 100% !important;
    }
    .subscription, .more_content, .nickname, .identifier{
        text-align: center;
    }
    .more_content{
        width: auto !important;
        margin-left: auto;
        margin-right: auto;
    }
}

@media only screen and (max-width: 1024px) {
    .picture{
        left: 14%;
    }
    .empty_box{
        width: 30%;
    }
}



    
</style>