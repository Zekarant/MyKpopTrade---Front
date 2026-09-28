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
            <div v-if="admin" class="more_content" @click="toggleMenu($event)">
                <i class="bi bi-three-dots-vertical"></i>
                <div v-if="isMenuVisible" class="dropdown-menu">
                    <ul>
                        <li @click="router.push({ name: 'settings' })">
                            <i class="bi bi-gear me-2"></i> Paramètres
                        </li>
                    </ul>
                </div>
            </div>
            <div class="profil_inner">
                <div class="empty_box"></div>
                <div class="profil_main">
                    <div class="identity">
                        <div class="nickname_block">
                            <span class="nickname_text_field">{{ profilInfo.username }}</span>
                            <VerifiedBadge v-if="profilInfo.isIdentityVerified" :size="16" />
                        </div>
                        <div class="identifier">@{{ profilInfo.username }}</div>
                    </div>
                    <div class="stats">
                        <span class="subscription"><span class="bold">{{ followingCount }}</span> Abonnements</span>
                        <span class="subscription"><span class="bold">{{ followersCount }}</span> Abonnés</span>
                    </div>
                    <div v-if="!isYouProfil" class="actions">
                        <button @click="openMessagePopup" type="button" class="btn btn-outline">Envoyer un message</button>
                        <button @click="toggleFollow" type="button" :class="['btn', isFollowing ? 'btn-outline' : 'btn-primary']">{{ isFollowing ? 'Suivi' : 'Suivre' }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!--------- Popup send message ---------->
    <send_message :id_user="profilInfo.id" :pseudo_user="profilInfo.username" @closeSendMessage="openMessagePopup" v-if="popupMessage"></send_message>
    <!--------- Popup delete ---------->
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

</template>

<script lang="ts">
    import { useRoute, useRouter } from "vue-router";
    import followService from '@/services/follow.service';
    import { createApiClient } from '@/services/http';
    import { API_URL } from '@/config/api';
    import send_message from './send_message.vue';
    import VerifiedBadge from '@/components/VerifiedBadge.vue';

    const DEFAULT_PROFILE_PICTURE = 'https://mykpoptrade.com/images/avatar-default.png';

    /**
     * Client partagé : renouvelle la session expirée (15 min) et rejoue la
     * requête. Les appels `axios` nus envoyaient `Bearer undefined` passé ce
     * délai, et l'upload échouait sans rejeu.
     */
    const api = createApiClient({ baseURL: API_URL });

    /** Chemin d'upload de l'API, ou URL absolue (avatars Google / Discord). */
    const mediaUrl = (path: unknown): string | null => {
        if (typeof path !== 'string' || !path) return null;
        return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
    };

    type ApiError = { response?: { status?: number; data?: { message?: string } } };

    interface LocalProfilInfo {
        profileBanner: string | null;
        profilePicture: string | null;
        [key: string]: unknown;
    }

    // La modale « Paramètres » qui vivait ici (mot de passe, téléphone, PayPal,
    // identité, export, suppression) était inatteignable : openSettings() n'était
    // appelé nulle part. Ces réglages vivent dans views/adherents/settings.vue.
    export default {
        name: "banner_profil",
        data() {
            return {
                isYouProfil: false,
                isMenuVisible: false,
                showDeletePictureConfirmation: false,
                showDeletePictureBannerConfirmation: false,
                localProfilInfo: {
                    profileBanner: null,
                    profilePicture: null,
                } as LocalProfilInfo,
                popupMessage: false,
                isFollowing: false,
                followersCount: 0,
                followingCount: 0,
            };
        },
        components: {
            send_message,
            VerifiedBadge,
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
            profilInfo: {
                handler(newValue) {
                    if (newValue) {
                        Object.assign(this.localProfilInfo, newValue);
                        if (newValue.id || newValue._id) {
                            this.loadFollowData();
                        }
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
            async loadFollowData() {
                const userId = this.profilInfo?.id || this.profilInfo?._id;
                if (!userId) return;
                try {
                    if (!this.isYouProfil) {
                        const status = await followService.getStatus(userId);
                        this.isFollowing = status.isFollowing;
                    }
                    const followers = await followService.getFollowers(userId, 1, 1);
                    this.followersCount = followers.total || 0;
                    const following = await followService.getFollowing(userId, 1, 1);
                    this.followingCount = following.total || 0;
                } catch (e) {
                    console.error('Erreur chargement follow:', e);
                }
            },
            async toggleFollow() {
                const userId = this.profilInfo?.id || this.profilInfo?._id;
                if (!userId) return;
                try {
                    const res = await followService.toggleFollow(userId);
                    this.isFollowing = res.isFollowing;
                    this.followersCount += res.isFollowing ? 1 : -1;
                } catch (e) {
                    console.error('Erreur toggle follow:', e);
                }
            },
            toggleMenu(event: Event){
                event.stopPropagation();
                this.isMenuVisible = !this.isMenuVisible;
            },
            closeMenu(){
                this.isMenuVisible = false;
            },
            closePopup(){
                this.showDeletePictureConfirmation = false;
                this.showDeletePictureBannerConfirmation = false;
            },
            /** Toast d'erreur, sauf session perdue : le client a déjà redirigé vers /login. */
            showUploadError(error: unknown, fallback: string) {
                const apiError = error as ApiError;
                if (apiError?.response?.status === 401) return;
                this.$func.showToastError(apiError?.response?.data?.message || fallback);
            },
            triggerFileInput() {
                const fileInput = this.$refs.fileInput as HTMLInputElement;
                fileInput.click();
            },
            triggerFileInputBanner() {
                const fileInput = this.$refs.fileInputbanner as HTMLInputElement;
                fileInput.click();
            },
            // Pas d'en-tête Content-Type manuel : l'ancien « multipart/form-data. »
            // (point final, sans boundary) était invalide ; axios le pose correctement
            // pour un FormData.
            async updatePictureBanner(event: Event) {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('profileBanner', file);
                try {
                    const response = await api.post('/api/profiles/me/banner', formData);
                    this.localProfilInfo.profileBanner = response.data.profileBanner;
                } catch (error) {
                    this.showUploadError(error, 'Impossible d\'envoyer la bannière.');
                }
            },
            async updatePicture(event: Event) {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('profilePicture', file);
                try {
                    const response = await api.post('/api/profiles/me/picture', formData);
                    this.localProfilInfo.profilePicture = response.data.profilePicture;
                } catch (error) {
                    this.showUploadError(error, 'Impossible d\'envoyer la photo.');
                }
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
            async confirmDeleteBanner(){
                try {
                    await api.delete('/api/profiles/me/banner');
                    this.localProfilInfo.profileBanner = null;
                    this.showDeletePictureBannerConfirmation = false;
                } catch (error) {
                    this.showUploadError(error, 'Impossible de supprimer la bannière.');
                }
            },
            async confirmDeletePicture() {
                try {
                    await api.delete('/api/profiles/me/picture');
                    this.localProfilInfo.profilePicture = null;
                    this.showDeletePictureConfirmation = false;
                } catch (error) {
                    this.showUploadError(error, 'Impossible de supprimer la photo.');
                }
            },
            openMessagePopup(){
                this.popupMessage = !this.popupMessage;
            },
        },
        computed: {
            profilePictureUrl() {
                if(this.localProfilInfo.profilePicture == DEFAULT_PROFILE_PICTURE){
                    return DEFAULT_PROFILE_PICTURE;
                }
                return mediaUrl(this.localProfilInfo.profilePicture);
            },
            banneerictureUrl() {
                return mediaUrl(this.localProfilInfo.profileBanner);
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
    min-height: 320px;
    position: relative;
    border-bottom: 0.5px solid var(--secondary-color-tint)
}
.profil{
    min-height: 140px;
    padding: 10px 0;
    position: relative;
}
.profil_inner{
    display: flex;
    align-items: flex-start;
}
.profil_main{
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 5px;
    padding-right: 30px;
}
.identity{
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.stats{
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
}
.actions{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.actions .btn{
    width: auto;
    font-size: 12px;
}
.background{
    background: var(--primary-color);
    width:100%;
    max-width: 100%;
    height: 160px;
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
    top: 95px;
    left: 30px;
    z-index: 2;
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
   width: 170px;
   flex-shrink: 0;
   min-height: 70px;
   margin:0px;
   padding:0px
}
.nickname_block{
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
    text-align: left;
}
.subscription .bold{
    color: var(--primary-color);
}
.more_content {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  z-index: 3;
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

.setting-label-group {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
}

.setting-sublabel {
    font-size: 0.85rem;
    color: var(--secondary-color-shade);
    word-break: break-all;
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
        top: calc(15vh - 60px);
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
        width: 100%;
        padding-top: 80px;
    }
    .row-banner{
        width: 100% !important;
    }
    .profil_main{
        align-items: center;
        text-align: center;
        padding-right: 0;
    }
    .identity{
        align-items: center;
    }
    .stats{
        justify-content: center;
    }
    .actions{
        justify-content: center;
        width: 100%;
    }
    .subscription, .identifier{
        text-align: center;
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
