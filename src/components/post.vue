<template>
   <div class="post-modal">
        <div v-if="isLoading" class="post-modal__loading">
            <div class="post-modal__spinner"></div>
            <p>Chargement...</p>
        </div>
        <div v-else-if="dataInitialized" class="post-modal__card">
            <!-- Image section -->
            <div class="post-modal__gallery">
                <div v-if="dataPost.isReserved" class="post-modal__badge post-modal__badge--reserved">
                    <i class="bi bi-lock-fill"></i> Réservé
                </div>
                <ImageCarousel :images="dataPost?.images || []" />
                <button v-if="!myProfile && dataSeller._id != myId && !isFav" @click="addFav(dataPost._id)" class="post-modal__fav-btn">
                    <i class="bi bi-heart"></i>
                </button>
                <button v-if="!myProfile && dataSeller._id != myId && isFav" @click="rmFav(dataPost._id)" class="post-modal__fav-btn post-modal__fav-btn--active">
                    <i class="bi bi-heart-fill"></i>
                </button>
            </div>

            <!-- Content section -->
            <div class="post-modal__content">
                <!-- Close button -->
                <button class="post-modal__close" @click="closePost()">
                    <i class="bi bi-x-lg"></i>
                </button>

                <!-- Seller header -->
                <div class="post-modal__seller" @click="viewUser()">
                    <div class="post-modal__avatar" v-html="profilePictureUrl"></div>
                    <div class="post-modal__seller-info">
                        <span class="post-modal__username">@{{ dataSeller.username }}</span>
                        <span v-if="dataSeller.isIdentityVerified" class="post-modal__verified">
                            <img src="@/assets/images/certif.svg" alt="Vérifié">
                            Vérifié
                        </span>
                    </div>
                    <div class="post-modal__actions-menu" @click.stop="toggleMenu($event)">
                        <i class="bi bi-three-dots-vertical"></i>
                        <div v-if="isMenuVisible" class="post-modal__dropdown">
                            <button v-if="!myProfile && !isRoot" @click="showPopupReport=true">
                                <i class="bi bi-flag"></i> Signaler
                            </button>
                            <button v-if="myProfile || isRoot" @click="hidePopup()">
                                <i class="bi bi-cart-check"></i> Vendu
                            </button>
                            <button v-if="myProfile || isRoot" @click="showDeletePopup = !showDeletePopup">
                                <i class="bi bi-trash"></i> Supprimer
                            </button>
                            <button v-if="myProfile || isRoot" @click="modifyPost">
                                <i class="bi bi-pencil"></i> Modifier
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Title & Price -->
                <div class="post-modal__header">
                    <h2 class="post-modal__title">{{ dataPost.title }}</h2>
                    <div class="post-modal__price">{{ dataPost.price }} {{ currencySymbol }}</div>
                </div>

                <!-- Description -->
                <div class="post-modal__description">
                    <p>{{ dataPost.description }}</p>
                </div>

                <!-- Details -->
                <div class="post-modal__details">
                    <div v-if="dataPost.condition" class="post-modal__detail-item">
                        <span class="post-modal__detail-label">État</span>
                        <span class="post-modal__detail-value">{{ dataPost.condition.charAt(0).toUpperCase() + dataPost.condition.slice(1) }}</span>
                    </div>
                    <div v-if="dataPost.category" class="post-modal__detail-item">
                        <span class="post-modal__detail-label">Catégorie</span>
                        <span class="post-modal__detail-value">{{ dataPost.category }}</span>
                    </div>
                    <div v-if="dataPost.kpopGroupName" class="post-modal__detail-item">
                        <span class="post-modal__detail-label">Groupe</span>
                        <span class="post-modal__detail-value">{{ dataPost.kpopGroupName }}</span>
                    </div>
                    <div v-if="dataPost.kpopMember" class="post-modal__detail-item">
                        <span class="post-modal__detail-label">Membre</span>
                        <span class="post-modal__detail-value">{{ dataPost.kpopMember }}</span>
                    </div>
                    <div v-if="dataPost.albumNameStr" class="post-modal__detail-item">
                        <span class="post-modal__detail-label">Album</span>
                        <span class="post-modal__detail-value">{{ dataPost.albumNameStr }}</span>
                    </div>
                </div>

                <!-- Shipping -->
                <div v-if="dataPost.shippingOptions" class="post-modal__shipping">
                    <span class="post-modal__detail-label">Livraison</span>
                    <div class="post-modal__shipping-tags">
                        <span v-if="dataPost.shippingOptions.worldwide" class="post-modal__tag">
                            <i class="bi bi-globe"></i> Mondiale
                        </span>
                        <span v-if="dataPost.shippingOptions.nationalOnly" class="post-modal__tag">
                            <i class="bi bi-geo-alt"></i> Nationale
                        </span>
                        <span v-if="dataPost.shippingOptions.localPickup" class="post-modal__tag">
                            <i class="bi bi-hand-index"></i> Main propre
                        </span>
                    </div>
                </div>

                <!-- Type badge -->
                <div class="post-modal__type">
                    <span class="post-modal__type-badge">
                        {{ dataPost.type ? (dataPost.type.charAt(0).toUpperCase() + dataPost.type.slice(1)) : '' }}
                    </span>
                </div>

                <!-- Action buttons -->
                <div v-if="!dataPost.isReserved && !myProfile && !isRoot" class="post-modal__footer">
                    <button v-if="dataPost.allowOffers" class="post-modal__btn post-modal__btn--outline" @click="showOfferOption = true">
                        <i class="bi bi-tag"></i> Faire une offre
                    </button>
                    <button class="post-modal__btn post-modal__btn--primary" @click="buyOption">
                        <i class="bi bi-bag"></i> Acheter
                    </button>
                    <button class="post-modal__btn post-modal__btn--ghost" @click="openMessagePopup">
                        <i class="bi bi-chat-dots"></i> Message
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Offer modal -->
    <div v-if="showOfferOption">
      <send_offer :product="dataPost" @offerSent="handleOfferSent" @close="showOfferOption = false"></send_offer>
    </div>

    <!-- Send message -->
    <send_message :id_user="dataSeller.id" :pseudo_user="dataSeller.username" :id_post="dataPost._id" @closeSendMessage="openMessagePopup" v-if="popupMessage"></send_message>

    <!-- Sold confirmation -->
    <div v-if="showSoldPopup" class="post-modal__confirm-overlay" @click.self="hidePopup">
        <div class="post-modal__confirm">
            <i class="bi bi-cart-check post-modal__confirm-icon"></i>
            <p>Marquer cet article comme vendu ?</p>
            <div class="post-modal__confirm-actions">
                <button class="post-modal__btn post-modal__btn--outline" @click="hidePopup">Annuler</button>
                <button class="post-modal__btn post-modal__btn--danger" @click="sold(dataPost._id, dataSeller.id)">Confirmer</button>
            </div>
        </div>
    </div>

    <!-- Checkout -->
    <CheckoutDialog
      v-if="showBuyOption && dataInitialized"
      :product-id="dataPost._id"
      :product-title="dataPost.title"
      :product-price="dataPost.price"
      :currency="dataPost.currency || 'EUR'"
      :shipping-options="dataPost.shippingOptions || {}"
      @confirm="onCheckoutConfirmed"
      @cancel="showBuyOption = false"
    />

    <!-- Delete confirmation -->
    <div v-if="showDeletePopup" class="post-modal__confirm-overlay" @click.self="closeDeletePopup">
        <div class="post-modal__confirm">
            <i class="bi bi-trash post-modal__confirm-icon post-modal__confirm-icon--danger"></i>
            <p>Supprimer définitivement cet article ?</p>
            <div class="post-modal__confirm-actions">
                <button class="post-modal__btn post-modal__btn--outline" @click="closeDeletePopup">Annuler</button>
                <button class="post-modal__btn post-modal__btn--danger" @click="deletePost(dataPost._id)">Supprimer</button>
            </div>
        </div>
    </div>

    <!-- Report -->
    <report_card @closeReport="showPopupReport = false" :type="'product'" :id="dataPost._id" v-if="showPopupReport"></report_card>
</template>



<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import report_card from '../components/report_card.vue';
    import ImageCarousel from '../components/ImageCarousel.vue';
    import send_message from '../components/adherents/send_message.vue';
    import send_offer from '../components/send_offer.vue';
    import CheckoutDialog from '../components/checkout/CheckoutDialog.vue';

    import postService from '@/services/post.service';
    import paymentService from '@/services/payment.service';
    import { useRoute, useRouter } from "vue-router";
    import Cookies from 'js-cookie';
    import userService from "@/services/user.service";
    import type { ImgUserProfile } from '@/types/user.types';
    import messagingService from '@/services/messaging.service';


    export default defineComponent({
        name: "post",
        components: {
            ImageCarousel,
            report_card,
            send_message,
            send_offer,
            CheckoutDialog
        },
        props: {
            dataUser: {
                type: Object,
                required: false,
            },
            idPost:{
                type: String
            },
            myProfile: {
                type: Boolean,
                required: false,
                default: false,
            }


        },
        emits: ['closePost', 'sold'],
        data() {
            return {
                dataPost: {} as Record<string, any>,
                dataSeller: {} as Record<string, any>,
                isMenuVisible: false,
                isRoot: false,
                showSoldPopup: false,
                showDeletePopup: false,
                isFav: false,
                showPopupReport: false,
                popupMessage: false,
                isLoading: true,
                dataInitialized: false,
                showOfferOption: false,
            };
        },
        setup(props){
            const myId = Cookies.get('id_user');
            const route = useRoute();
            const router = useRouter();
            const showBuyOption = ref(false);


            const buyOption = () => {
                showBuyOption.value = !showBuyOption.value;
            };

            // Fonction pour créer une iframe modale PayPal avec détection d'erreur
            const createPaypalIframe = (approvalUrl: string, paymentId: string) => {
                try {
                    // Vérifier si une iframe PayPal existe déjà
                    const existingModal = document.getElementById('paypal-iframe-modal');
                    if (existingModal) {
                        existingModal.remove();
                    }

                    // Créer la modale avec iframe
                    const modal = document.createElement('div');
                    modal.id = 'paypal-iframe-modal';
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        z-index: 9999;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    `;

                    const modalContent = document.createElement('div');
                    modalContent.style.cssText = `
                        position: relative;
                        width: 90%;
                        height: 90%;
                        max-width: 500px;
                        max-height: 700px;
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    `;

                    // Header de la modale
                    const modalHeader = document.createElement('div');
                    modalHeader.style.cssText = `
                        padding: 15px 20px;
                        background: #0070ba;
                        color: white;
                        font-family: Arial, sans-serif;
                        font-size: 16px;
                        font-weight: bold;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    `;
                    modalHeader.innerHTML = `
                        <span>Paiement PayPal</span>
                        <button id="close-paypal-modal" style="
                            background: none;
                            border: none;
                            color: white;
                            font-size: 20px;
                            cursor: pointer;
                            padding: 0;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        " title="Fermer">×</button>
                    `;

                    // Iframe PayPal
                    const iframe = document.createElement('iframe');
                    iframe.src = approvalUrl;
                    iframe.style.cssText = `
                        width: 100%;
                        height: calc(100% - 60px);
                        border: none;
                        display: block;
                    `;

                    // Loader pendant le chargement
                    const loader = document.createElement('div');
                    loader.id = 'paypal-loader';
                    loader.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        font-family: Arial, sans-serif;
                    `;
                    loader.innerHTML = `
                        <div style="margin-bottom: 10px;">Chargement PayPal...</div>
                        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0070ba; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                        <style>
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        </style>
                    `;

                    // Variables pour gérer les événements
                    let messageHandler: ((event: MessageEvent) => void) | null = null;
                    let iframeLoadHandler: (() => void) | null = null;
                    let iframeErrorHandler: (() => void) | null = null;
                    let isIframeLoaded = false;
                    let iframeError = false;

                    // Fonction pour nettoyer et fermer la modale
                    const closeModal = () => {
                        if (messageHandler) {
                            window.removeEventListener('message', messageHandler);
                        }
                        if (iframeLoadHandler) {
                            iframe.removeEventListener('load', iframeLoadHandler);
                        }
                        if (iframeErrorHandler) {
                            iframe.removeEventListener('error', iframeErrorHandler);
                        }
                        if (modal && document.body.contains(modal)) {
                            modal.remove();
                        }
                        checkPaymentStatus(paymentId);
                    };

                    // Gérer les messages de PayPal dans l'iframe
                    messageHandler = (event: MessageEvent) => {
                        // Ignorer les messages de télémétrie PayPal
                        if (event.data.p2Sent || event.data.utils) {
                            return;
                        }

                        // Vérifier l'origine pour la sécurité
                        if (event.origin !== 'https://www.sandbox.paypal.com' &&
                            event.origin !== 'https://www.paypal.com') {
                            return;
                        }
                        if (event.data.type === 'payment_success') {
                            closeModal();
                            onPaymentSuccess(event.data.paymentId || paymentId);
                        } else if (event.data.type === 'payment_cancelled') {
                            closeModal();
                            onPaymentCancelled();
                        }
                    };

                    // Gérer le chargement de l'iframe
                    iframeLoadHandler = () => {
                        isIframeLoaded = true;
                        const loaderElement = document.getElementById('paypal-loader');
                        if (loaderElement) {
                            loaderElement.style.display = 'none';
                        }
                    };

                    // Gérer les erreurs de l'iframe
                    iframeErrorHandler = () => {
                        iframeError = true;
                        console.error('Erreur lors du chargement de l\'iframe PayPal');
                    };

                    // Event listeners
                    iframe.addEventListener('load', iframeLoadHandler);
                    iframe.addEventListener('error', iframeErrorHandler);
                    window.addEventListener('message', messageHandler);

                    // Event listener pour fermer la modale
                    const closeButton = modalHeader.querySelector('#close-paypal-modal');
                    if (closeButton) {
                        closeButton.addEventListener('click', closeModal);
                    }

                    // Fermer en cliquant sur l'arrière-plan
                    modal.addEventListener('click', (event) => {
                        if (event.target === modal) {
                            closeModal();
                        }
                    });

                    // Fermer avec la touche Escape
                    const escapeHandler = (event: KeyboardEvent) => {
                        if (event.key === 'Escape') {
                            document.removeEventListener('keydown', escapeHandler);
                            closeModal();
                        }
                    };
                    document.addEventListener('keydown', escapeHandler);

                    // Assembler la modale
                    modalContent.appendChild(modalHeader);
                    modalContent.appendChild(loader);
                    modalContent.appendChild(iframe);
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);
                    // Focus sur l'iframe après un court délai
                    setTimeout(() => {
                        if (iframe) {
                            iframe.focus();
                        }
                    }, 500);

                    // Retourner une référence à la modale pour vérifications ultérieures
                    return {
                        modal: modal,
                        iframe: iframe,
                        isVisible: () => document.body.contains(modal) && modal.style.display !== 'none',
                        isLoaded: () => isIframeLoaded,
                        hasError: () => iframeError,
                        close: closeModal
                    };

                } catch (error) {
                    console.error('Erreur lors de la création de l\'iframe PayPal:', error);
                    return null;
                }
            };

            // Fonction pour gérer les événements de l'onglet
            const handleTabEvents = (tabWindow: Window, paymentId: string) => {
                let checkClosedInterval: number | null = null;
                let messageHandler: ((event: MessageEvent) => void) | null = null;

                // Fonction pour nettoyer les listeners et intervals
                const cleanup = () => {
                    if (checkClosedInterval) {
                        clearInterval(checkClosedInterval);
                        checkClosedInterval = null;
                    }
                    if (messageHandler) {
                        window.removeEventListener('message', messageHandler);
                        messageHandler = null;
                    }
                };

                // Gérer les messages de PayPal
                messageHandler = (event: MessageEvent) => {
                    // Ignorer les messages de télémétrie PayPal
                    if (event.data.p2Sent || event.data.utils) {
                        return;
                    }

                    // Vérifier l'origine pour la sécurité
                    if (event.origin !== 'https://www.sandbox.paypal.com' &&
                        event.origin !== 'https://www.paypal.com') {
                        return;
                    }
                    if (event.data.type === 'payment_success') {
                        tabWindow.close();
                        cleanup();
                        onPaymentSuccess(event.data.paymentId || paymentId);
                    } else if (event.data.type === 'payment_cancelled') {
                        tabWindow.close();
                        cleanup();
                        onPaymentCancelled();
                    }
                };

                // Surveiller la fermeture de l'onglet
                checkClosedInterval = window.setInterval(() => {
                    try {
                        if (tabWindow.closed) {
                            cleanup();
                            checkPaymentStatus(paymentId);
                        }
                    } catch (error) {
                        // Erreur d'accès cross-origin, considérer comme fermé
                        console.error('Onglet PayPal fermé (cross-origin) :', error);
                        cleanup();
                        checkPaymentStatus(paymentId);
                    }
                }, 1000);

                // Écouter les messages
                window.addEventListener('message', messageHandler);

                // Donner le focus à l'onglet
                try {
                    tabWindow.focus();
                } catch (error) {
                    console.error('Impossible de donner le focus à l\'onglet'+error);
                }
            };

            const onCheckoutConfirmed = (result: any) => {
                showBuyOption.value = false;

                const approvalUrl = result?.payment?.approvalUrl
                    || (result?.payment?.paypalOrderId
                        ? `https://www.sandbox.paypal.com/checkoutnow?token=${result.payment.paypalOrderId}`
                        : null);

                if (!result?.success || !approvalUrl) {
                    alert('Erreur lors de l\'initialisation du paiement. Veuillez réessayer.');
                    return;
                }

                const iframeResult: any = createPaypalIframe(approvalUrl, result.payment.id);

                setTimeout(() => {
                    if (iframeResult && iframeResult.isVisible && iframeResult.isVisible()) {
                        return;
                    }
                    if (iframeResult && iframeResult.close) iframeResult.close();
                    const newTab = window.open(approvalUrl, '_blank');
                    if (newTab) {
                        handleTabEvents(newTab, result.payment.id);
                    } else {
                        alert('Impossible d\'ouvrir PayPal. Veuillez autoriser les popups ou copier ce lien : ' + approvalUrl);
                    }
                }, 500);
            };

            const checkPaymentStatus = async (paymentId: string) => {
                try {
                    const statusResponse = await paymentService.checkPaymentStatus(paymentId);
                    if (statusResponse.success) {
                        if (statusResponse.status === 'approved' || statusResponse.status === 'completed') {
                            onPaymentSuccess(paymentId);
                        } else if (statusResponse.status === 'cancelled') {
                            onPaymentCancelled();
                        } else {
                        }
                    }
                } catch (error) {
                    console.error('Erreur lors de la vérification du statut:', error);
                }
            };

            const onPaymentSuccess = async (paymentId: string) => {
                try {
                    alert('Paiement réussi ! Le produit a été marqué comme vendu.');
                    // Recharger les données du post
                    window.location.reload();
                } catch (error) {
                    console.error('Erreur lors du traitement du succès:', error);
                    alert('Paiement réussi mais erreur lors du traitement. Contactez le support.');
                }
            };

            const onPaymentCancelled = () => {
                alert('Paiement annulé. Vous pouvez réessayer à tout moment.');
            };

            const id = route.params.id;
            return {
                route,
                router,
                id,
                myId,
                showBuyOption,
                buyOption,
                onCheckoutConfirmed,
                handleTabEvents,
                createPaypalIframe,
                checkPaymentStatus,
                onPaymentSuccess,
                onPaymentCancelled
            };
        },
        async mounted() {
            await this.initializeComponent();
        },


        computed: {
            profilePictureUrl() {
                const profileImgInfo: ImgUserProfile = {
                username: this.dataSeller.username,
                profilePicture: this.dataSeller.profilePicture
                };
                return userService.renderUserAvatar(profileImgInfo);
            },
            currencySymbol() {
                const symbols = {
                    EUR: '€',
                    USD: '$',
                    KRW: '₩',
                    JPY: '¥',
                    GBP: '£',
                };
                return symbols[this.dataPost.currency as keyof typeof symbols] || '';
            },

        },
        methods: {

            async initializeComponent() {
                try {
                    this.isLoading = true;
                    await this.getData();
                    if (!this.dataPost || Object.keys(this.dataPost).length === 0) {
                        throw new Error('Données du post non chargées');
                    }

                    this.initializeUserData();
                    this.dataInitialized = true;

                } catch (error) {
                    console.error('Erreur lors de l\'initialisation:', error);
                } finally {
                    this.isLoading = false;
                }
            },
            initializeUserData() {
                if (this.dataUser && Object.keys(this.dataUser).length > 0) {
                    this.dataSeller = { ...this.dataUser };
                } else {
                    this.dataSeller = this.dataPost.seller ? { ...this.dataPost.seller } : {};
                    this.isRoot = false;
                }

                if (this.dataSeller._id && this.dataSeller._id === this.myId) {
                    this.isRoot = true;
                }
            },
            async getData() {
                const response = await postService.getPost(this.idPost);
                if (response && response.product) {
                    this.dataPost = response.product;
                    this.isFav = response.isFavorite || false;
                }else{
                }
            },
            toggleMenu(event: Event){
                event.stopPropagation();
                this.isMenuVisible = !this.isMenuVisible;
            },
            hidePopup(){
                this.showSoldPopup = !this.showSoldPopup;
            },
            closeDeletePopup(){
                this.showDeletePopup = false;
            },
            async sold(id: string,userId: string){
                const response = await postService.sold(userId,id);
                if (response) {
                    this.showSoldPopup = false;
                    this.$emit('sold');
                }
            },
            async deletePost(id: string ){
                const response = await postService.deletePost(id);
                if (response) {
                    this.showDeletePopup = false;
                    this.$emit('sold');
                }
            },
            modifyPost(){
                this.router.push({
                    name: 'modify_post',
                    query: {
                        postData: JSON.stringify(this.dataPost)
                    }
                });
            },
            async addFav(id: string){
                await postService.addFavorite(id).then(() => {
                    this.$func.showToastSuccess('Ajouter avec succès à mes favoris');
                    this.isFav = true;
                });;
            },
            async rmFav(id: string){
                await postService.addFavorite(id).then(() => {
                    this.$func.showToastSuccess('Supprimé de mes favoris');
                    this.isFav = false;
                });;
            },

            closePost() {
                this.$emit('closePost');
            },
            viewUser(){
                this.router.push({ name: 'profile' , params: { id: this.dataSeller.username }});
            },
            openMessagePopup(){
                this.popupMessage = !this.popupMessage;
            },
            async handleOfferSent(offerInfo: { offerData: { productId: string; }; amount: number; message: string; }){
                this.showOfferOption = false

                const offerData = {
                    productId: offerInfo.offerData.productId,
                    initialOffer: offerInfo.amount,
                    message:  offerInfo.message
                };
                messagingService.initiateNegotiation(
                    offerData
                ).then(() => {
                    this.$func.showToastSuccess('Offre envoyée avec succès !');
                }).catch(error => {
                    console.error('Erreur lors de l\'envoi de l\'offre:', error);
                    this.$func.showToastError('Erreur lors de l\'envoi de l\'offre.');
                })
            }

        },
    });


</script>

<style lang="scss" scoped>
@use '../css/post.scss';
</style>
