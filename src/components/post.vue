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
                        <span class="post-modal__username">
                            @{{ dataSeller.username }}
                            <VerifiedBadge v-if="dataSeller.isIdentityVerified" :size="14" />
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
                <div v-if="dataPost.shippingOptions" :title="`${dataPost.shippingPrice} €`" class="post-modal__shipping">
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
                    <button class="post-modal__btn post-modal__btn--cart" :class="{ 'post-modal__btn--cart-added': addedToCart }" @click="addToCart" :disabled="addingToCart || addedToCart">
                        <i :class="addedToCart ? 'bi bi-cart-check-fill' : 'bi bi-cart-plus'"></i> {{ addedToCart ? 'Ajouté ✓' : addingToCart ? '...' : 'Panier' }}
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
    import VerifiedBadge from '../components/VerifiedBadge.vue';

    import postService from '@/services/post.service';
    import paymentService from '@/services/payment.service';
    import cartService from '@/services/cart.service';
    import eventBus from '@/eventBus';
    import { func } from '@/function';
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
            CheckoutDialog,
            VerifiedBadge
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
                addingToCart: false,
                addedToCart: false,
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

            const onCheckoutConfirmed = (result: any) => {
                showBuyOption.value = false;

                // L'URL d'approbation vient de PayPal via l'API : elle pointe donc
                // toujours vers le bon environnement. Ne jamais la reconstruire en dur.
                const approvalUrl = result?.payment?.approvalUrl ?? null;

                if (!result?.success || !approvalUrl) {
                    if (result?.payment?.paypalOrderId) {
                        paymentService.cancelPayPal(result.payment.paypalOrderId).catch(() => {});
                    }
                    func.showToastError('Erreur lors de l\'initialisation du paiement. Veuillez réessayer.');
                    return;
                }

                // Redirection complète vers PayPal — l'acheteur approuve puis revient sur /payment/success
                window.location.href = approvalUrl;
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
            },
            async addToCart() {
                if (this.addingToCart || this.addedToCart) return;
                this.addingToCart = true;
                try {
                    await cartService.addItem(this.dataPost._id);
                    this.addedToCart = true;
                    this.$func.showToastSuccess('Article ajouté au panier !');
                    eventBus.emit('cart:updated');
                } catch (error: any) {
                    const msg = error?.response?.data?.message || 'Erreur lors de l\'ajout au panier';
                    this.$func.showToastError(msg);
                } finally {
                    this.addingToCart = false;
                }
            }

        },
    });


</script>

<style lang="scss" scoped>
@use '../css/post.scss';
</style>
