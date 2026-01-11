<template>
    <div @click="closeMenu" class="content">
        <div v-if="admin" class="background" @click="triggerFileInputBanner">
            <img v-if="localProfilInfo.profileBanner" :src="banneerictureUrl || undefined" alt="Banner Picture" />
            <div v-else class="background"></div>
            <i  v-if="localProfilInfo.profileBanner" @click="deletePicturePopup($event,'banner')" style="position: absolute; right: 5px; bottom: 0px; color: white; background: #0000005c; border-radius: 4px; cursor: pointer;"  class="bi bi-trash"></i>
            <input type="file" ref="fileInputbanner" @change="updatePictureBanner" accept="image/*" style="display: none;" />
        </div>
        <div v-else class="background">
            <img v-if="localProfilInfo.profileBanner" :src="banneerictureUrl || undefined" alt="Banner Picture" />
            <div v-else class="background"></div>
        </div>

        <div @click="triggerFileInput"  v-if="admin" class="picture">
            <img v-if="localProfilInfo.profilePicture && localProfilInfo.profilePicture  != 'https://mykpoptrade.com/images/avatar-default.png'" :src="profilePictureUrl || undefined" alt="Profile Picture" />
            <div v-else class="empty-profile">
                <i class="bi bi-camera"></i>
            </div>
            <i  v-if="localProfilInfo.profilePicture && localProfilInfo.profilePicture  != 'https://mykpoptrade.com/images/avatar-default.png'" @click="deletePicturePopup($event,'profil')" style="position: absolute; right: 0px; bottom: 0px; color: white; background: #0000005c; border-radius: 4px; cursor: pointer;"  class="bi bi-trash"></i>
            <input type="file" ref="fileInput" @change="updatePicture" accept="image/*" style="display: none;" />
        </div>
        <div  v-else class="picture">
            <img v-if="localProfilInfo.profilePicture && localProfilInfo.profilePicture  != 'https://mykpoptrade.com/images/avatar-default.png'" :src="profilePictureUrl || undefined" alt="Profile Picture" />           
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
        <!--------- Popup Paramètre - NOUVEAU DESIGN ---------->
        <div v-if="showSetting" class="popup-overlay" @click="closePopup()">
            <div @click="$event.stopPropagation()" class="popup-content popup-settings-modern">
                <!-- Header -->
                <div class="settings-header">
                    <h4 class="settings-title">
                        <i class="bi bi-gear-fill"></i>
                        Paramètres
                    </h4>
                    <button @click="closePopup()" class="btn-close-settings">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>

                <!-- Content avec sections -->
                <div class="settings-content">
                    <!-- Section Sécurité -->
                    <div class="settings-section">
                        <h5 class="section-title">Sécurité</h5>
                        <div class="setting-item-modern" @click="changePswdPopup()">
                            <div class="setting-item-left">
                                <i class="bi bi-shield-lock setting-icon"></i>
                                <span class="setting-label">Changer le mot de passe</span>
                            </div>
                            <i class="bi bi-chevron-right setting-arrow"></i>
                        </div>
                    </div>

                    <!-- Section Vérifications -->
                    <div class="settings-section">
                        <h5 class="section-title">Vérifications</h5>
                        
                        <div class="setting-item-modern" @click="getVerifIdentityState">
                            <div class="setting-item-left">
                                <i class="bi bi-person-badge setting-icon"></i>
                                <span class="setting-label">Identité vérifiée</span>
                            </div>
                            <div class="setting-item-right">
                                <i v-if="profilInfo.isIdentityVerified" class="bi bi-check-circle-fill status-icon status-success"></i>
                                <i v-else-if="profilInfo.verificationLevel == 'none'" class="bi bi-x-circle-fill status-icon status-error"></i>
                                <i v-if="!profilInfo.isIdentityVerified" class="bi bi-chevron-right setting-arrow"></i>
                            </div>
                        </div>

                        <div class="setting-item-modern">
                            <div class="setting-item-left">
                                <i class="bi bi-envelope setting-icon"></i>
                                <span class="setting-label">Email vérifié</span>
                            </div>
                            <div class="setting-item-right">
                                <span v-if="emailRequest" class="status-badge status-badge-info">Email envoyé</span>
                                <button @click="verifEmail()" class="btn-verify" v-else-if="!profilInfo.isEmailVerified && !emailRequest">Vérifier</button>
                                <i v-if="profilInfo.isEmailVerified" class="bi bi-check-circle-fill status-icon status-success"></i>
                            </div>
                        </div>

                        <div class="setting-item-modern setting-item-phone">
                            <div class="setting-item-left">
                                <i class="bi bi-phone setting-icon"></i>
                                <span class="setting-label">Téléphone</span>
                            </div>
                            <div class="setting-item-right setting-phone-content">
                                <i v-if="localProfilInfo.isPhoneVerified || codeRequest" class="bi bi-check-circle-fill status-icon status-success"></i>
                                <input v-if="!telRequest || codeRequest" type="tel" class="input-phone" id="phone" @input="isBtnSaveTelVisible=true" v-model="phoneNumber" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">
                                <button @click="saveTel" class="btn-verify" v-if="isBtnSaveTelVisible">Enregistrer</button>
                            </div>
                        </div>

                        <div v-if="telRequest && !codeRequest" class="setting-item-expanded">
                            <div class="verification-code-container">
                                <span class="verification-label">Code de vérification :</span>
                                <div class="verification-input-group">
                                    <input placeholder="Entrez le code" v-model="phoneCode" type="number" class="input-code">
                                    <button @click="verifCodeTel()" class="btn-verify-code">Vérifier</button>
                                </div>
                            </div>
                        </div>

                        <button v-else-if="!localProfilInfo.isPhoneVerified && !telRequest && phoneNumber && !isBtnSaveTelVisible && !codeRequest" @click="verifTel()" class="btn-verify-standalone">Vérifier le téléphone</button>
                    </div>

                    <!-- Section Paiement -->
                    <div class="settings-section">
                        <h5 class="section-title">Paiement</h5>
                        <div class="setting-item-modern setting-item-paypal">
                            <div class="setting-item-left">
                                <i class="bi bi-paypal setting-icon"></i>
                                <span class="setting-label">Email Paypal</span>
                            </div>
                            <div class="setting-item-right setting-paypal-content">
                                <input @input="saveMailPaypal = true" type="email" class="input-paypal" id="paypal" v-model="emailPaypal">
                                <div class="paypal-actions">
                                    <button @click="savePaypal" class="btn-save-paypal" v-if="saveMailPaypal">Enregistrer</button>
                                    <button @click="showDeletePaypalPopup = true; showSetting = false" class="btn-delete-paypal" v-if="localProfilInfo.paypalEmail">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section Préférences -->
                    <div class="settings-section">
                        <h5 class="section-title">Préférences</h5>
                        <div class="setting-item-modern">
                            <div class="setting-item-left">
                                <i class="bi bi-chat-dots setting-icon"></i>
                                <span class="setting-label">Messages directs</span>
                            </div>
                            <label class="switch-modern">
                                <input 
                                    type="checkbox"
                                    :checked="profilInfo.preferences.allowDirectMessages"
                                    @change="changeAllowDirectMessages($event)"
                                    >
                                <span class="slider-modern"></span>
                            </label>
                        </div>
                    </div>

                    <!-- Section Données -->
                    <div class="settings-section">
                        <h5 class="section-title">Mes données</h5>
                        <button class="btn-action-full" @click="exportUserData">
                            <i class="bi bi-download"></i>
                            Exporter mes données
                        </button>
                        <button v-if="!profilInfo.anonymized" class="btn-action-full btn-action-secondary" @click="anonymizePopup = true">
                            <i class="bi bi-shield-check"></i>
                            Anonymiser mes données
                        </button>
                    </div>

                    <!-- Section Danger Zone -->
                    <div class="settings-section settings-danger-zone" v-if="profilInfo.accountStatus === 'active'">
                        <h5 class="section-title section-title-danger">Zone de danger</h5>
                        <button class="btn-action-full btn-action-danger" @click="showDeleteAccount = true">
                            <i class="bi bi-exclamation-triangle"></i>
                            Supprimer votre compte
                        </button>
                    </div>
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
                    <div v-if="!verification.userVerification.isVerified && verification.verification.status == 'pending'">
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
    import { PDFExportService } from '@/services/PDFExportService.service';
    import authentificationService from '@/services/authentification.service';
    import send_message from './send_message.vue';

    interface LocalProfilInfo {
        isPhoneVerified: boolean;
        [key: string]: unknown;
    }

    export default {
        name: "banner_profil",
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
                passwordForConfirm: '',
                localProfilInfo: {
                    isPhoneVerified: false,
                    profileBanner: null,
                    profilePicture: null,
                } as LocalProfilInfo,
                popupMessage: false,
                verification: null as any,
                documentType:'id_card',
                newPassword: '',
                confirmPassword: '',
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
        watch: {
            'profilInfo.isPhoneVerified'(newValue) {
                this.localProfilInfo.isPhoneVerified = newValue;
            },
            'profilInfo.profileBanner'(newValue) {
                this.localProfilInfo.profileBanner = newValue;  
            },
            'profilInfo.profilePicture'(newValue) {
                this.localProfilInfo.profilePicture = newValue;  
            },
            'profilInfo.paypalEmail'(newValue) {
                this.localProfilInfo.paypalEmail = newValue;  
            },
            profilInfo: {
                handler(newValue) {
                    if (newValue) {
                        Object.assign(this.localProfilInfo, newValue);
                    }
                },
                immediate: true,
                deep: true,
            },
        },
        mounted() {
            this.checkUserProfile();
        },
        created() {
            this.checkUserProfile();
        },

        methods: {
            checkUserProfile() {
                const id = this.route.params.id;
                if(id == 'me'){
                    this.isYouProfil = true;
                }
            },
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
            formatDate(dateString: string) {
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
                    const formData = new FormData();

                    formData.append('profileBanner', file);

                    const sessionToken = Cookies.get('sessionToken');
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/me/banner`, formData, {
                        headers: {
                        'Content-Type': 'multipart/form-data.',
                        'Authorization': `Bearer ${sessionToken}`

                        }
                    }).then(response => {

                        if (response.status === 200) {
                            this.localProfilInfo.profileBanner = response.data.profileBanner;

                        }
                    }).catch(error => {
                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                            authentificationService.verifSession();
                        }
                        console.log(error);
                    });
                }
            },
            async updatePicture(event: Event) {
                const file = (event.target as HTMLInputElement).files?.[0];
          
                if (file) {
                    console.log(file);

                    const formData = new FormData();

                    formData.append('profilePicture', file);
                    console.log('Contenu de FormData :', Array.from(formData.entries()));
                    const sessionToken = Cookies.get('sessionToken');
                    console.log(formData);
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/me/picture`, formData, {
                        headers: {
                        'Content-Type': 'multipart/form-data.',
                        'Authorization': `Bearer ${sessionToken}`

                        }
                    }).then(response => {

                    if (response.status === 200) {
                        this.localProfilInfo.profilePicture = response.data.profilePicture;

                    }
                    }).catch(error => {
                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                           authentificationService.verifSession();
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
                    
                    this.localProfilInfo.profileBanner = null;
                    this.showDeletePictureBannerConfirmation = false; 
                })
                .catch((error) => {
                    console.error(error);
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
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
                    this.localProfilInfo.profilePicture = null;
                    this.showDeletePictureConfirmation = false;
                })
                .catch((error) => {
                    console.error(error);
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();

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
                               authentificationService.verifSession();
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
                    'Authorization': `Bearer ${sessionToken}`

                    }
                }).then(response => {

                    if (response.status === 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.verifIdentityPopup = false;
                        this.showSetting = true;
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
                    }
                    this.$func.showToastError(error.response.data.message);

                });
            },
            verifIdentity(){
                const sessionToken = Cookies.get('sessionToken');
                const data = new FormData();
                data.append('documentType',  this.documentType);
                data.append('consentGiven',  String(this.consentUseData));
                if (this.documentIamge) {
                    data.append('document', this.documentIamge);
                }
                axios.post(`${import.meta.env.VITE_API_URL}/api/verification/identity`, data, {
                    headers: {
                    'Authorization': `Bearer ${sessionToken}`

                    }
                }).then(response => {

                    if (response.status === 201) {
                        this.verifIdentityPopup = false;
                        this.showSetting = true;
                        this.$func.showToastSuccess(response.data.message);
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
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
                    'Authorization': `Bearer ${sessionToken}`

                    }
                }).then(response => {

                    if (response.status === 200) {
                        this.emailRequest = true;
                        this.$func.showToastSuccess(response.data.message);

                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
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
                    'Authorization': `Bearer ${sessionToken}`

                    }
                }).then(response => {

                    if (response.status === 200) {
                        this.telRequest = true;
                        this.$func.showToastSuccess(response.data.message);

                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
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
                    'Authorization': `Bearer ${sessionToken}`

                    }
                }).then(response => {

                    if (response.status === 200) {
                        this.codeRequest = true;
                    
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
                    }
                });
            },
            async changeAllowDirectMessages(event: Event){ 
                const target = event.target as HTMLInputElement
                const value = target.checked;
                const sessionToken = Cookies.get('sessionToken');

                await axios.put(`${import.meta.env.VITE_API_URL}/api/profiles/me`, 
                {
                    preferences: {
                        allowDirectMessages: value
                    },
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionToken}`

                    }
                }).then(response => {
                        console.log(response);
                        if (response.status === 200) {
                            this.$func.showToastSuccess(response.data.message);
                        }
                    }).catch(error => {
                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                           authentificationService.verifSession();
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
                        'Authorization': `Bearer ${sessionToken}`

                        }
                }).then(response => {
                    if (response.status === 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.isBtnSaveTelVisible = false;
                        this.telRequest = false;
                        this.codeRequest = false;
                        this.phoneCode = '';
                        this.localProfilInfo.isPhoneVerified = false; 
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
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
                        'Authorization': `Bearer ${sessionToken}`

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
                       authentificationService.verifSession();
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
                    const pdfExporter = new PDFExportService();
                    type SectionColor = [number, number, number];  // Définition explicite

                    const sections: { key: string; label: string; color: SectionColor }[] = [
                        { key: 'user', label: 'Informations Utilisateur', color: [46, 125, 50] },
                        { key: 'products', label: 'Posts/Articles', color: [231, 76, 60] },
                        { key: 'orders', label: 'Commandes/Achats', color: [155, 89, 182] },
                        { key: 'messages', label: 'Messages/Conversations', color: [52, 152, 219] },
                        { key: 'favorites', label: 'Favoris/Liste de souhaits', color: [241, 196, 15] },
                        { key: 'reviews', label: 'Avis/Evaluations', color: [230, 126, 34] },
                        { key: 'settings', label: 'Parametres/Preferences', color: [149, 165, 166] }
                    ];
                    pdfExporter.createPDF(response.data,'MyKPopTrade - Export des Données',sections);

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
                    authentificationService.logout();
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
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
                       authentificationService.verifSession();
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
                        'Authorization': `Bearer ${sessionToken}`
                    },
                    data: {
                        paypalEmail: this.emailPaypal
                    }
                }).then(response => {
                    if (response.status === 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.saveMailPaypal = false;
                        this.emailPaypal = '';
                        this.localProfilInfo.paypalEmail = '';
                        this.showDeletePaypalPopup = false;

                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
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
                        'Authorization': `Bearer ${sessionToken}`

                    }
                }).then(response => {
                    console.log(response);
                    if (response.status === 200) {
                        this.$func.showToastSuccess(response.data.message);
                        this.saveMailPaypal = false;
                        this.localProfilInfo.paypalEmail = this.emailPaypal;
                    }
                }).catch(error => {
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                       authentificationService.verifSession();
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
                if(this.localProfilInfo.profilePicture == 'https://mykpoptrade.com/images/avatar-default.png'){
                    return 'https://mykpoptrade.com/images/avatar-default.png';
                }else{
                const baseUrl = import.meta.env.VITE_API_URL;
                return this.localProfilInfo.profilePicture
                ? `${baseUrl}${this.localProfilInfo.profilePicture}`
                : null;
                }
          
            },
            banneerictureUrl() {
                const baseUrl = import.meta.env.VITE_API_URL;
                return this.localProfilInfo.profileBanner
                ? `${baseUrl}${this.localProfilInfo.profileBanner}`
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
  font-size: 3rem;
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

/* ============================================ */
/* NOUVEAU DESIGN MODERNE POPUP PARAMÈTRES */
/* ============================================ */
.popup-settings-modern {
    width: 600px;
    max-width: 95vw;
    max-height: 85vh;
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark, #1a1a2e) 100%);
    color: white;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
}

.btn-close-settings {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: all 0.3s ease;
}

.btn-close-settings:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
}

.settings-content {
    padding: 20px 28px 28px;
    overflow-y: auto;
    flex: 1;
}

.settings-section {
    margin-bottom: 32px;
}

.settings-section:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--secondary-color-shade);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--secondary-color-tint);
}

.section-title-danger {
    color: var(--danger-color);
    border-bottom-color: var(--danger-color);
}

.setting-item-modern {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-radius: 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.setting-item-modern:hover {
    background: #e9ecef;
    border-color: var(--primary-color);
    transform: translateX(4px);
}

.setting-item-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.setting-icon {
    font-size: 1.3rem;
    color: var(--primary-color);
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.setting-label {
    font-size: 1rem;
    font-weight: 500;
    color: var(--primary-color);
}

.setting-item-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.setting-arrow {
    font-size: 1.1rem;
    color: var(--secondary-color-shade);
}

.status-icon {
    font-size: 1.3rem;
}

.status-success {
    color: var(--success-color);
}

.status-error {
    color: var(--danger-color);
}

.status-badge {
    font-size: 0.75rem;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 600;
}

.status-badge-info {
    background: #d1ecf1;
    color: #0c5460;
}

.btn-verify {
    font-size: 0.8rem;
    padding: 6px 16px;
    border-radius: 20px;
    background: var(--primary-color);
    color: white;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-verify:hover {
    background: var(--primary-color-dark, #1a1a2e);
    transform: scale(1.05);
}

/* Éléments de configuration spéciaux */
.setting-item-phone,
.setting-item-paypal {
    flex-direction: column;
    align-items: stretch;
    cursor: default;
}

.setting-item-phone:hover,
.setting-item-paypal:hover {
    transform: none;
}

.setting-phone-content,
.setting-paypal-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    margin-top: 12px;
}

.input-phone,
.input-paypal {
    flex: 1;
    padding: 10px 14px;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.input-phone:focus,
.input-paypal:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb, 0, 0, 0), 0.1);
}

.paypal-actions {
    display: flex;
    gap: 8px;
}

.btn-save-paypal {
    padding: 8px 16px;
    background: var(--success-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-save-paypal:hover {
    background: #28a745;
    transform: translateY(-2px);
}

.btn-delete-paypal {
    padding: 8px 12px;
    background: var(--danger-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-delete-paypal:hover {
    background: #c82333;
    transform: translateY(-2px);
}

/* Vérification téléphone étendue */
.setting-item-expanded {
    padding: 16px 20px;
    background: #e7f3ff;
    border-radius: 12px;
    margin-top: -8px;
    margin-bottom: 8px;
    border: 2px solid var(--primary-color);
}

.verification-code-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.verification-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-color);
}

.verification-input-group {
    display: flex;
    gap: 12px;
}

.input-code {
    flex: 1;
    padding: 10px 14px;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    font-size: 0.9rem;
}

.btn-verify-code {
    padding: 10px 20px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-verify-code:hover {
    background: var(--primary-color-dark, #1a1a2e);
}

.btn-verify-standalone {
    width: 100%;
    padding: 12px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 8px;
}

/* Switch moderne */
.switch-modern {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
}

.switch-modern input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider-modern {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 28px;
}

.slider-modern:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked + .slider-modern {
    background-color: var(--primary-color);
}

input:checked + .slider-modern:before {
    transform: translateX(24px);
}

/* Boutons d'action pleine largeur */
.btn-action-full {
    width: 100%;
    padding: 14px 20px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
    background: var(--primary-color);
    color: white;
}

.btn-action-full:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-action-secondary {
    background: var(--secondary-color);
    color: var(--primary-color);
}

.btn-action-danger {
    background: var(--danger-color);
    color: white;
}

.btn-action-danger:hover {
    background: #c82333;
}

/* Zone de danger */
.settings-danger-zone {
    border: 2px solid var(--danger-color);
    border-radius: 12px;
    padding: 20px;
    background: #fff5f5;
}

/* Responsive */
@media (max-width: 768px) {
    .popup-settings-modern {
        width: 95vw;
        max-height: 90vh;
    }

    .settings-header {
        padding: 20px;
    }

    .settings-title {
        font-size: 1.25rem;
    }

    .settings-content {
        padding: 16px 20px 20px;
    }

    .setting-item-modern {
        padding: 14px 16px;
    }

    .setting-icon {
        font-size: 1.1rem;
    }

    .setting-label {
        font-size: 0.9rem;
    }
}

/* Ancien styles conservés */
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
