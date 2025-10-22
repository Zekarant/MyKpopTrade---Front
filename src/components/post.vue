<template>
   <div class="container_detail_card">
        <div v-if="isLoading" class="loading-container">
            <p>Chargement...</p>
        </div>
        <div v-else-if="dataInitialized" class="card">
            <div class="post_card_content">
                <i style="position: absolute; top: 5px; right: 5px; width: 20px; zoom: 1.5; z-index: 3; color: var(--primary-color);" @click="closePost()" class="bi bi-x-lg display_phone_tablette"></i>
                <div @click="viewUser()" class="post_card_content_header">
                    <div class="userPicture" v-html="profilePictureUrl"></div>
                    <div>
                        <div class="identifier">@{{ dataSeller.username }}</div>
                        <div v-if="dataSeller.isIdentityVerified" class="img_certif_container">
                            <img src="@/assets/images/certif.svg">
                        </div>
                    </div>
                    <div class="col-md-1 more_content" @click="toggleMenu($event)">
                        <i class="bi bi-three-dots-vertical"></i>
                        <div v-if="isMenuVisible" class="dropdown-menu">
                                <ul style="width: 100%;">
                                    <li v-if="!myProfile && !isRoot" @click="showPopupReport=true">
                                        <i class="bi bi-signal me-2"></i>
                                        Signaler
                                    </li>
                                    <li v-if="myProfile || isRoot" @click="hidePopup()">
                                        <i class="bi bi-cart-check-fill me-2"></i>
                                        Vendu
                                    </li>
                                    <li v-if="myProfile || isRoot" @click="showDeletePopup = !showDeletePopup">
                                        <i class="bi bi-trash me-2"></i>
                                        Supprimer
                                    </li>
                                    <li v-if="myProfile || isRoot" @click="modifyPost">
                                        <i class="bi bi-pen me-2"></i>
                                        Modifier
                                    </li>
                                    
                                </ul>
                        </div>
                    </div>
                </div>
                <div class="post_card_detail">
                    <div style="display: flex;">
                        <b >{{ dataPost.title }} </b>
                        <b class="price">
                            {{ dataPost.price }} {{ currencySymbol }}
                        </b>
                    </div>
                   <div class="description_container">
                        <b class="post_description_label">Description : </b>
                        <br>
                        <div class="post_description">
                            <p>{{ dataPost.description }}</p>
                        </div>
                    </div>
              
                    <div class="list_detail">
                        <div class="bloc_detail condition">
                            <div>
                                <p>État :</p>
                            </div>
                            <div>
                                <p>
                                {{ dataPost.condition ? (dataPost.condition.charAt(0).toUpperCase() + dataPost.condition.slice(1)) : '' }}
                                </p>
                            </div>
                        </div>
                        <div class="bloc_detail category">
                            <div>
                                <p> Catégorie :</p>
                            </div>
                            <div>
                                <p>{{ dataPost.category }}</p>
                            </div>
                        </div>
                        <div class="bloc_detail kpopGroup">
                            <div>
                                <p>Groupe :</p>
                            </div>
                            <div>
                                <p>{{ dataPost.kpopGroup }}</p>
                            </div>
                        </div>
                        <div class="bloc_detail kpopMember">
                            <div>
                                <p>Membre :</p>
                            </div>
                            <div>
                                <p>{{ dataPost.kpopMember }}</p>
                            </div>
                        </div>
                        <div class="bloc_detail albumName">
                            <div>
                                <p>Album :</p>
                            </div>
                            <div>
                                <p>{{ dataPost.albumName }}</p>
                            </div>
                        </div>
                        <div  v-if="dataPost.shippingOptions" class="bloc_detail shippingOptions">
                            <div>
                                <p>Livraison :</p>
                            </div>
                            <div>
                                <div class="shippingOptions_line" v-if="dataPost.shippingOptions.worldwide">Mondiale</div>
                                <div class="shippingOptions_line" v-if="dataPost.shippingOptions.nationalOnly"><span v-if="dataPost.shippingOptions.worldwide">,</span> Nationale</div>
                                <div class="shippingOptions_line" v-if="dataPost.shippingOptions.localPickup"><span v-if="dataPost.shippingOptions.nationalOnly || dataPost.shippingOptions.worldwide ">,</span> Remise en main propre</div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <div class="type_content">
                        {{ dataPost.type ? (dataPost.type.charAt(0).toUpperCase() + dataPost.type.slice(1)) : '' }}                        
                        </div>
                    </div>
                </div>
                <div v-if="!dataPost.isReserved && !myProfile && !isRoot" class="post_card_content_footer">
                    <button v-if="dataPost.allowOffers" class="btn-blue-outline" type="button">Faire une offre</button>
                    <button class="btn-blue-outline"  @click="buyOption"  type="button">Acheter</button>
                    <button @click="openMessagePopup" class="btn-blue-outline" type="button">Envoyer un message</button>
                </div>
            </div>
            <div class="illustration">
                <div v-if="dataPost.isReserved" class="banner_reserved">
                    <div class="state">Réservé</div>
                </div>
                <ImageCarousel :images="dataPost?.images || []" />
                <button v-if="!myProfile && dataSeller._id != myId && !isFav" @click="addFav(dataPost._id)" class="like">
                    <i class="bi bi-heart imgcenter"></i>
                </button>
                <button v-if="!myProfile && dataSeller._id != myId && isFav" @click="rmFav(dataPost._id)" class="like">
                    <i style="color:var(--danger-color)" class="bi bi-heart-fill imgcenter"></i>
                </button>
            </div>


        </div>


    </div>
    <!--------- Popup Pour envoyer un message ---------->
    <send_message :id_user="dataSeller._id" :pseudo_user="dataSeller.username" :id_post="dataPost._id" @closeSendMessage="openMessagePopup" v-if="popupMessage"></send_message>


    <!--------- Popup ---------->
    <div v-if="showSoldPopup" class="popup-overlay" @click.self="hidePopup">
        <div class="popup-content">
            <p>Voulez-vous vraiment mettre cet article comme vendu ?</p>
            <div class="popup-buttons-footer">
                <button style="border-radius: 2px; width: 100%;" class="btn btn-primary-outline" @click="hidePopup">Annuler</button>
                <button style="border-radius: 2px; width: 100%;" class="btn btn-danger" @click="sold(dataPost._id, dataSeller.id)">Vendu</button>
            </div>
        </div>
    </div>
    <!-- Option d'achat Modal -->
    <div class="popup-overlay" v-if="showBuyOption" @click.self="buyOption">
      <div @click.stop class="popup-content">
        <div style="cursor: pointer;" @click="initPaypal" >
          <i class="bi bi-paypal"></i>          
          Payer avec PayPal
        </div>
      </div>
    </div>


    <!--------- Popup Suppression ---------->
    <div v-if="showDeletePopup" class="popup-overlay" @click.self="closeDeletePopup">
        <div class="popup-content">
            <p>Voulez-vous vraiment supprimer cet article  ?</p>
            <div class="popup-buttons-footer">
                <button style="border-radius: 2px; width: 100%;" class="btn btn-primary-outline" @click="closeDeletePopup">Annuler</button>
                <button style="border-radius: 2px; width: 100%;" class="btn btn-danger" @click="deletePost(dataPost._id)">Supprimer</button>
            </div>
        </div>
    </div>
    
    <report_card @closeReport="showPopupReport = false" :type="'product'" :id="dataPost._id" v-if="showPopupReport"></report_card>


</template>
  


<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import axios from 'axios';
    import card_illu from '../components/card_illu.vue';
    import report_card from '../components/report_card.vue';
    import ImageCarousel from '../components/ImageCarousel.vue';
    import send_message from '../components/adherents/send_message.vue';
    
    import postService from '@/services/post.service';
    import paymentService from '@/services/payment.service';
    import { useRoute, useRouter } from "vue-router";
    import Cookies from 'js-cookie';
    import userService from "@/services/user.service";
    import type { ImgUserProfile } from '@/types/user.types';


    export default defineComponent({
        name: "post",
        components: {
            card_illu,
            ImageCarousel,
            report_card,
            send_message
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
                dataInitialized: false
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
                        console.log('Iframe PayPal fermée');
                        checkPaymentStatus(paymentId);
                    };

                    // Gérer les messages de PayPal dans l'iframe
                    messageHandler = (event: MessageEvent) => {
                        // Ignorer les messages de télémétrie PayPal
                        if (event.data.p2Sent || event.data.utils) {
                            console.log('Message de télémétrie PayPal ignoré');
                            return;
                        }
                        
                        // Vérifier l'origine pour la sécurité
                        if (event.origin !== 'https://www.sandbox.paypal.com' && 
                            event.origin !== 'https://www.paypal.com') {
                            return;
                        }
                        
                        console.log('Message reçu de PayPal iframe:', event.data);
                        
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
                        console.log('Iframe PayPal chargée avec succès');
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

                    console.log('Iframe PayPal créée et ajoutée à la page');
                    
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
                        console.log('Message de télémétrie PayPal ignoré');
                        return;
                    }
                    
                    // Vérifier l'origine pour la sécurité
                    if (event.origin !== 'https://www.sandbox.paypal.com' && 
                        event.origin !== 'https://www.paypal.com') {
                        return;
                    }
                    
                    console.log('Message reçu de PayPal onglet:', event.data);
                    
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
                            console.log('Onglet PayPal fermé');
                            checkPaymentStatus(paymentId);
                        }
                    } catch (error) {
                        // Erreur d'accès cross-origin, considérer comme fermé
                        cleanup();
                        console.log('Onglet PayPal fermé (cross-origin)');
                        checkPaymentStatus(paymentId);
                    }
                }, 1000);

                // Écouter les messages
                window.addEventListener('message', messageHandler);

                // Donner le focus à l'onglet
                try {
                    tabWindow.focus();
                } catch (error) {
                    console.log('Impossible de donner le focus à l\'onglet');
                }

                console.log('Onglet PayPal ouvert et surveillé');
            };

            const initPaypal = async () => {
                try {
                    showBuyOption.value = false;
                    // Utiliser props.idPost au lieu de route.params.id
                    console.log('Initialisation PayPal pour le produit:', props.idPost);
                    
                    if (!props.idPost) {
                        alert('Erreur: ID du produit non disponible');
                        return;
                    }
                    
                    const retour_initPayPal = await paymentService.initPayPal(props.idPost);
                    console.log(retour_initPayPal);
                    
                    if (retour_initPayPal.success && retour_initPayPal.payment?.approvalUrl) {
                        console.log('Ouverture PayPal avec iframe...');
                        
                        // Essayer d'abord l'iframe
                        const iframeResult = createPaypalIframe(retour_initPayPal.payment.approvalUrl, retour_initPayPal.payment.id);
                        
                        // Vérifier si l'iframe s'est bien créée
                        setTimeout(() => {
                            if (iframeResult && iframeResult.isVisible()) {
                                console.log('Iframe PayPal active et fonctionnelle');
                            } else {
                                console.error('Iframe PayPal non fonctionnelle, ouverture nouvel onglet...');
                                
                                // Fermer l'iframe si elle existe
                                if (iframeResult && iframeResult.close) {
                                    iframeResult.close();
                                }
                                
                                // Fallback : ouvrir dans un nouvel onglet
                                const newTab = window.open(retour_initPayPal.payment.approvalUrl, '_blank');
                                if (newTab) {
                                    console.log('Nouvel onglet PayPal ouvert');
                                    handleTabEvents(newTab, retour_initPayPal.payment.id);
                                } else {
                                    console.error('Impossible d\'ouvrir un nouvel onglet');
                                    alert('Impossible d\'ouvrir PayPal. Veuillez autoriser les popups/onglets ou copier ce lien : ' + retour_initPayPal.payment.approvalUrl);
                                }
                            }
                        }, 500);
                        
                    } else {
                        console.error('Erreur lors de l\'initialisation PayPal:', retour_initPayPal);
                        alert('Erreur lors de l\'initialisation du paiement PayPal. Veuillez réessayer.');
                    }
                } catch (error) {
                    console.error('Erreur PayPal:', error);
                    alert('Une erreur est survenue lors de l\'initialisation du paiement PayPal.');
                }
            };

            const checkPaymentStatus = async (paymentId: string) => {
                try {
                    console.log('Vérification du statut de paiement:', paymentId);
                    const statusResponse = await paymentService.checkPaymentStatus(paymentId);
                    console.log('Statut du paiement:', statusResponse);
                    
                    if (statusResponse.success) {
                        if (statusResponse.status === 'approved' || statusResponse.status === 'completed') {
                            onPaymentSuccess(paymentId);
                        } else if (statusResponse.status === 'cancelled') {
                            onPaymentCancelled();
                        } else {
                            console.log('Paiement en attente ou statut inconnu:', statusResponse.status);
                        }
                    }
                } catch (error) {
                    console.error('Erreur lors de la vérification du statut:', error);
                }
            };

            const onPaymentSuccess = async (paymentId: string) => {
                try {
                    console.log('Paiement réussi:', paymentId);
                    alert('Paiement réussi ! Le produit a été marqué comme vendu.');
                    // Recharger les données du post
                    window.location.reload();
                } catch (error) {
                    console.error('Erreur lors du traitement du succès:', error);
                    alert('Paiement réussi mais erreur lors du traitement. Contactez le support.');
                }
            };

            const onPaymentCancelled = () => {
                console.log('Paiement annulé par l\'utilisateur');
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
                initPaypal,
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
                var profileImgInfo : ImgUserProfile = {
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
            async sold(id: any,userId: any){
                const response = await postService.sold(userId,id);
                if (response) {
                    this.showSoldPopup = false;
                    this.$emit('sold');
                }
            },
            async deletePost(id: any){
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
            async addFav(id: any){
                await postService.addFavorite(id).then(addFavorite => {                
                    this.$func.showToastSuccess('Ajouter avec succès à mes favoris');
                    this.isFav = true;
                });;
            },
            async rmFav(id: any){
                await postService.addFavorite(id).then(addFavorite => {                
                    this.$func.showToastSuccess('Supprimé de mes favoris');
                    this.isFav = true;
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
            }
      
        },
        watch: {
            dataPost(newValue, oldValue) {
            },
        },
    });


</script>
  
  <style lang="scss" scoped>
    .banner_reserved{
        background: var(--danger-color);
        width: 100%;
        position: absolute;
        top: 0;
        z-index: 9;
        
    }
    .post_card_detail{
        display: block;
        margin-bottom: auto;
    }
    .post_card_detail .price{
        margin-left: auto;
        font-size:medium; 
        color: var(--blue); 
        margin-bottom: 20px;
    }
    .post_card_detail b{
    
    }
    .banner_reserved .state{
        color: white;
        font-size: large;
        font-weight: bold;
        text-align: center;
    }
    .container_detail_card{
        display: block;
        margin-left: auto;
        margin-right: auto;
        z-index: 9;
        width: 80%;
        height: 80%;
    }
    .container_detail_card .card{
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;   
        height: 100%;
    }
    .illustration{
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 50%;
        height: 100%;
        align-items: center;
        justify-content: center;
        background: black;
        position: relative;
    }
    .like{
        position: absolute;
        right: 10px;
        z-index: 9;
        top: 10px;
        background: white;
        border-radius: 30px;    
        width: 45px;
        height: 45px;
        border: none;
    }
    i.bi.bi-heart::before{    
        height: 100%;
        width: 100%;
    }
    .card .screen {
        display: block;
        margin-right: auto;
        margin-left: auto;


        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        border-radius: 3px 3px 0 0;
        z-index: 1;


    }
    .card .back {
        display: flex;
        width: 100%;
        aspect-ratio: 1 / 1;        
        border-radius: 8px;
        position: relative;
        text-decoration: none;
        align-items: center;
        justify-content: center;
        background: var(--primary-color);
    }
    .post_card_content{
        height: 100%;
        width: 50%;
        flex-direction: column; 
        display: flex;
        overflow-x: scroll;
    }
    .post_card_content_header, .post_card_content_header div{
        display: flex;
    }
    .post_card_content_header, .post_card_detail, .post_card_content_footer{
        margin: 15px;
    }



    .img_certif_container{
        display: inline-block;
        width: 10px;
    }
    .img_certif_container img{
        width: 100%;
    }
    .identifier {
        display: flex;
        align-items: center; 
        height: 100%; 
        margin-left: 5px;
        margin-right: 5px;
    }
    .more_content {
        margin-left: auto; 
        display: flex;
        align-items: center;
        cursor: pointer;
    }
    .description_container{
        margin-top: 10px;
        border-bottom: 1px solid var(--secondary-color-tint);
    }
    .post_description_label{
        font-size: small;
    }
    .post_description{
        font-size: small;
        padding-bottom: 15px;
    }
    .list_detail{
        width: 60%;
    }
    .bloc_detail{
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px; 
        width: 100%;
        margin-top: 10px;
        font-size: small;
    }
    .bloc_detail p{
        margin-bottom: 0px;
    }
    .bloc_detail > div {
        display: flex;
        align-items: center; 
    }
    .type_content{
        width: min-content;
        color: #819A57;
        border: 2px solid #819A57;
        border-radius: 10px;
        padding: 5px;
        font-size: xx-small;
        font-weight: bold;
    }
    .shippingOptions_line{
        vertical-align: middle;
        display: flex
    }
    .post_card_content_footer {
        display: flex;
        flex-direction: row; 
        justify-content: center; 
        align-items: center; 
        margin: 10px;
        font-size: small;
        position: absolute;
        width: 47%;
        bottom: 0px;
    }


    .post_card_content_footer button{
        margin: 1%;
        font-size: small;
        width: 30%;


    }


    @media (max-width:980px){
        .container_detail_card .card{
            flex-direction: column-reverse;
        }
    }
    @media (max-width:820px){
        .post_card_content{
            width: 100%;
        }
        .illustration{
            width: 100%;
            height: 50%;
        }
        .container_detail_card{
            height: 90%;
        }
        .post_card_content_footer{
            position: relative;
            width: auto;
        }
    }
    @media (max-width:550px){
        .container_detail_card .card {
            overflow-y: scroll;
            display: flex;
            flex-wrap: nowrap; 
            white-space: nowrap; 
            width: 100%;    
        }
        .post_card_content{
            overflow-y: scroll;
            overflow-x: hidden;
        }
        .container_detail_card{
            width: 90%;
        }
        .post_description {
            font-size: small;
            padding-bottom: 15px;
            overflow-wrap: break-word; 
            word-wrap: break-word; 
            white-space: normal; 
            max-height: 100%; 
            overflow-y: auto; 
        }
        .post_card_detail div{
            flex-direction: column;
        }
        .post_card_detail b{
            margin-bottom: 0px;
        }
        .post_card_detail .price{
            margin-left: 0px;
        }
        .post_card_content_footer{
            flex-direction: column;
            position: relative;
            width: auto;
        }
        .post_card_content_footer button{
            width: 100%;
        }
    }
  </style>
