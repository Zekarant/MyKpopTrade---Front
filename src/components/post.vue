<template>
    <div class="post-modal">
        <div v-if="isLoading" class="post-modal__loading" role="status">
            <div class="post-modal__spinner"></div>
            <p>Chargement...</p>
        </div>
        <div v-else-if="dataInitialized" class="post-modal__card">
            <PostGallery v-model:favorite="isFav" :post="dataPost" :can-favorite="!isOwner" />

            <div class="post-modal__content">
                <button type="button" class="post-modal__close" aria-label="Fermer" @click="emit('closePost')">
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>

                <PostSellerHeader
                    :seller="dataSeller"
                    :is-owner="isOwner"
                    :is-sold="dataPost.isSold"
                    :is-withdrawn="dataPost.isAvailable === false"
                    @action="onMenuAction"
                />

                <div class="post-modal__header">
                    <h2 class="post-modal__title">{{ dataPost.title }}</h2>
                    <div class="post-modal__price">{{ formatPrice(dataPost.price, dataPost.currency) }}</div>
                </div>
                <div v-if="dataPost.isPayWhatYouWant" class="post-modal__pwyw">
                    <span class="post-modal__tag">
                        <i class="bi bi-cash-coin" aria-hidden="true"></i> Prix libre : {{ pwywLabel }}
                    </span>
                </div>

                <div class="post-modal__description">
                    <p>{{ dataPost.description }}</p>
                </div>

                <PostDetailsList :post="dataPost" />

                <PostActionsFooter
                    v-if="isPurchasable && !isOwner"
                    :product-id="dataPost._id"
                    :can-make-offer="canMakeOffer"
                    @offer="showOfferOption = true"
                    @buy="showBuyOption = !showBuyOption"
                    @message="popupMessage = true"
                />
            </div>
        </div>
    </div>

    <PostOfferDialog v-if="showOfferOption" :product="dataPost" @close="showOfferOption = false" />

    <send_message
        v-if="popupMessage"
        :id-user="sellerId"
        :pseudo-user="dataSeller.username"
        :id-post="dataPost._id"
        @close-send-message="popupMessage = false"
    />

    <PostOwnerDialogs
        v-if="ownerDialog"
        :dialog="ownerDialog"
        :product-id="dataPost._id"
        :is-sold="dataPost.isSold"
        @close="ownerDialog = null"
        @changed="emit('sold')"
    />

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

    <report_card v-if="showPopupReport" :id="dataPost._id" :type="'product'" @close-report="showPopupReport = false" />
</template>

<script setup lang="ts">
/** Fiche d'une annonce, en fenêtre (grilles) ou en page (/products/:id). */
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import report_card from '@/components/report_card.vue';
import send_message from '@/components/adherents/send_message.vue';
import CheckoutDialog from '@/components/checkout/CheckoutDialog.vue';
import { followCheckoutResult, type CheckoutResult } from '@/components/checkout/followCheckoutResult';
import PostGallery from './post/PostGallery.vue';
import PostSellerHeader from './post/PostSellerHeader.vue';
import PostDetailsList from './post/PostDetailsList.vue';
import PostActionsFooter from './post/PostActionsFooter.vue';
import PostOfferDialog from './post/PostOfferDialog.vue';
import PostOwnerDialogs from './post/PostOwnerDialogs.vue';
import { useRequireSession } from './post/useRequireSession';
import type { OwnerDialog, PostMenuAction, PostSeller } from './post/types';
import postService from '@/services/post.service';
import { currentUserId } from '@/services/session.cookies';
import { formatPrice } from '@/utils/format';
import { func } from '@/function';
import type { PostResponse, ProductDetail } from '@/types/post.types';
import { acceptsOffers, pwywRangeLabel } from './offerRules';
import { sellerIdOf } from './sellerId';

defineOptions({ name: 'PostModal' });

const props = withDefaults(defineProps<{
    /** Profil d'où la fiche est ouverte : remplace le vendeur peuplé de l'annonce. */
    dataUser?: PostSeller;
    idPost?: string;
    /** Annonce déjà chargée par le parent : évite une seconde requête (et une seconde vue comptée). */
    product?: PostResponse;
    myProfile?: boolean;
}>(), { dataUser: undefined, idPost: undefined, product: undefined, myProfile: false });

/** `sold` : l'annonce a changé d'état (vendue, remise en vente, supprimée). */
const emit = defineEmits<{ closePost: []; sold: [] }>();

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', KRW: '₩', JPY: '¥', GBP: '£' };

const myId = currentUserId();
const router = useRouter();

const dataPost = ref<ProductDetail>({} as ProductDetail);
const dataSeller = ref<PostSeller>({});
const isFav = ref(false);
const isLoading = ref(true);
const dataInitialized = ref(false);
const ownerDialog = ref<OwnerDialog | null>(null);
const showPopupReport = ref(false);
const popupMessage = ref(false);
const showOfferOption = ref(false);
const showBuyOption = ref(false);

const requireSession = useRequireSession(() => dataPost.value._id);

const sellerId = computed(() => sellerIdOf(dataSeller.value));
/** Le vendeur lui-même, ou sa fiche ouverte depuis son propre profil. */
const isOwner = computed(() => props.myProfile || Boolean(sellerId.value && sellerId.value === myId));
/** Ni vendu, ni retiré de la vente par son vendeur ou la modération. */
const isPurchasable = computed(() => !dataPost.value.isSold && dataPost.value.isAvailable !== false);
const canMakeOffer = computed(() => acceptsOffers(dataPost.value));
const pwywLabel = computed(() =>
    pwywRangeLabel(dataPost.value.pwywMinPrice, dataPost.value.pwywMaxPrice, CURRENCY_SYMBOLS[dataPost.value.currency] || '€')
);

onMounted(async () => {
    try {
        const response = props.product ?? await postService.getPost(props.idPost);
        if (!response?.product || Object.keys(response.product).length === 0) {
            throw new Error('Données du post non chargées');
        }
        dataPost.value = response.product;
        isFav.value = response.isFavorite || false;
        dataSeller.value = props.dataUser && Object.keys(props.dataUser).length > 0
            ? { ...props.dataUser }
            : { ...(response.product.seller ?? {}) };
        dataInitialized.value = true;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    } finally {
        isLoading.value = false;
    }
});

function onMenuAction(action: PostMenuAction) {
    if (action === 'copy') {
        copyLink();
    } else if (action === 'report') {
        showPopupReport.value = requireSession();
    } else if (action === 'edit') {
        router.push({ name: 'modify_post', query: { postData: JSON.stringify(dataPost.value) } });
    } else {
        ownerDialog.value = action;
    }
}

async function copyLink() {
    try {
        await navigator.clipboard.writeText(`${window.location.origin}/products/${dataPost.value._id}`);
        func.showToastSuccess('Lien copié');
    } catch {
        func.showToastError('Impossible de copier le lien.');
    }
}

function onCheckoutConfirmed(result: CheckoutResult | null | undefined) {
    showBuyOption.value = false;
    followCheckoutResult(result, (message) => func.showToastError(message));
}
</script>

<!--
    Non scopé : la fiche est découpée en sous-composants (./post/*) qui partagent
    le bloc BEM `post-modal__*` ; scopée, la feuille serait dupliquée dans chacun.
    Le préfixe suffit à éviter les fuites.
-->
<style lang="scss">
@use '../css/post.scss';
</style>
