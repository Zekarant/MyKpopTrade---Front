<template>
    <main class="page">
        <Nav_bar></Nav_bar>
        <div class="content">
            <!-- En-tête -->
            <div class="sell-header">
                <button type="button" class="sell-header__back" @click="$router.back()" aria-label="Retour">
                    <i class="bi bi-arrow-left"></i>
                </button>
                <div class="sell-header__text">
                    <h3 class="sell-header__title">
                        {{ isModyfy ? 'Modifier l\'annonce' : 'Vendre un article' }}
                    </h3>
                    <p class="sell-header__subtitle">
                        Étape {{ currentStep }} sur {{ steps.length }} · {{ currentStepMeta.label }}
                    </p>
                </div>
            </div>

            <!-- Blocage paiement : PayPal requis -->
            <div v-if="!paymentConfigured && !loadingPaymentStatus" class="paypal-required-banner">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <div>
                    <strong>Configuration paiement requise</strong>
                    <p>
                        Pour vendre sur MyKpopTrade, vous devez connecter un compte PayPal capable de
                        recevoir des paiements. Sans cela, un acheteur ne pourrait pas vous payer.
                    </p>
                </div>
                <div class="paypal-required-banner__actions">
                    <button class="btn-primary" @click="connectPayPal" :disabled="connectingPaypal">
                        <i class="bi bi-paypal"></i>
                        {{ connectingPaypal ? 'Redirection…' : 'Connecter PayPal' }}
                    </button>
                    <router-link to="/adherents/settings?section=paiements" class="btn-secondary">
                        <i class="bi bi-gear"></i> Gérer mes paiements
                    </router-link>
                </div>
            </div>

            <div v-else-if="loadingPaymentStatus" class="sell-loading">
                <i class="bi bi-hourglass-split"></i> Vérification de votre compte de paiement…
            </div>

            <template v-if="paymentConfigured">
                <!-- Fil d'étapes -->
                <ol class="sell-steps" aria-label="Progression">
                    <li
                        v-for="step in steps"
                        :key="step.id"
                        class="sell-steps__item"
                        :class="{
                            'sell-steps__item--active': step.id === currentStep,
                            'sell-steps__item--done': step.id < currentStep
                        }"
                    >
                        <button
                            type="button"
                            class="sell-steps__btn"
                            :disabled="step.id > currentStep"
                            @click="goToStep(step.id)"
                        >
                            <span class="sell-steps__marker">
                                <i v-if="step.id < currentStep" class="bi bi-check-lg"></i>
                                <template v-else>{{ step.id }}</template>
                            </span>
                            <span class="sell-steps__label">{{ step.label }}</span>
                        </button>
                    </li>
                </ol>

                <form @submit.prevent="onSubmit">

                <!-- Étape 1 : Photos -->
                <fieldset v-show="currentStep === 1" class="form-section">
                    <legend><i class="bi bi-images"></i> Photos</legend>
                    <p class="form-intro">
                        La première photo sert de vignette. Montrez l'article sous plusieurs angles,
                        ainsi que ses défauts éventuels : c'est ce qui évite la plupart des litiges.
                    </p>
                    <div v-if="imagesPreview.length == 0" class="image-drop-zone" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop" :class="{ 'drag-over': isDragOver }">
                        <i class="bi bi-cloud-arrow-up drop-icon"></i>
                        <span class="drop-text">Glissez vos photos ici</span>
                        <span class="drop-hint">ou cliquez pour parcourir</span>
                    </div>
                    <div v-else class="image-preview-container" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop" :class="{ 'drag-over': isDragOver }">
                        <swiper
                            class="image-swiper"
                            :slides-per-view="5"
                            :breakpoints="{
                                0: { slidesPerView: 2 },
                                720: { slidesPerView: 3 },
                                980: { slidesPerView: 4 }
                            }"
                            >
                            <swiper-slide v-for="(image, index) in imagesPreview" :key="index">
                                <div class="image-preview">
                                    <img class="imgcenter" :src="image" alt="Aperçu" />
                                    <span v-if="index === 0" class="image-preview__badge">Vignette</span>
                                    <i @click.stop="removeImage(index)" class="bi bi-trash delete_img"></i>
                                </div>
                            </swiper-slide>
                            <swiper-slide v-if="canAddMoreImages" class="add-image-slide">
                                <button style="height: 100%; margin-left: 10px;" class="btn-primary" type="button">+</button>
                            </swiper-slide>
                        </swiper>
                    </div>
                    <input type="file" id="imageUpload" @change="handleImageUpload" accept="image/*" multiple hidden ref="fileInput" />
                    <small class="form-hint">{{ imagesPreview.length }}/{{ MAX_IMAGES }} photos · JPG, PNG</small>
                </fieldset>

                <!-- Étape 2 : Informations -->
                <fieldset v-show="currentStep === 2" class="form-section">
                    <legend><i class="bi bi-tag"></i> Informations</legend>
                    <div>
                        <label for="title">Titre de l'annonce <span class="req">*</span></label>
                        <input type="text" id="title" v-model="formData.title" maxlength="120" placeholder="Ex: Photocard Jimin BE Lucky Draw" />
                        <small class="form-hint">{{ (formData.title || '').length }}/120</small>
                    </div>
                    <div>
                        <label for="description">Description <span class="req">*</span></label>
                        <textarea id="description" v-model="formData.description" maxlength="2000" placeholder="État, authenticité, provenance, défauts, conditions d'envoi…"></textarea>
                        <small class="form-hint">{{ (formData.description || '').length }}/2000</small>
                    </div>
                    <div class="form-row">
                        <div class="form-col">
                            <label for="price">Prix <span class="req">*</span></label>
                            <div class="input-with-addon">
                                <input type="number" id="price" v-model.number="formData.price" step="0.01" min="0" />
                                <select class="input-addon" v-model="formData.currency">
                                    <option value="EUR">€</option>
                                    <option value="USD">$</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-col">
                            <label for="condition">État <span class="req">*</span></label>
                            <select id="condition" v-model="formData.condition">
                                <option value="new">Neuf</option>
                                <option value="likeNew">Comme neuf</option>
                                <option value="good">Bon état</option>
                                <option value="fair">État moyen</option>
                                <option value="poor">Mauvais état</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-col">
                            <label for="type">Type d'article <span class="req">*</span></label>
                            <select id="type" v-model="formData.type">
                                <option value="photocard">Photocard</option>
                                <option value="album">Album</option>
                                <option value="merch">Merch</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
                        <div class="form-col">
                            <label for="category">Catégorie <span class="req">*</span></label>
                            <input type="text" id="category" v-model="formData.category" placeholder="Ex: Photocard, Lightstick..." />
                        </div>
                    </div>
                </fieldset>

                <!-- Étape 3 : K-pop -->
                <fieldset v-show="currentStep === 3" class="form-section">
                    <legend><i class="bi bi-music-note-beamed"></i> K-pop</legend>
                    <p class="form-intro">
                        Ces informations rendent votre annonce trouvable : la plupart des acheteurs
                        cherchent par groupe et par membre.
                    </p>
                    <div>
                        <label for="kpopGroup">Groupe <span class="req">*</span></label>
                        <div class="select-searchable">
                            <input
                                type="text"
                                id="kpopGroup"
                                v-model="searchGroupKpop"
                                @focus="isGroupDropdownOpen = true"
                                @blur="closeGroupDropdown"
                                placeholder="Rechercher un groupe..."
                                class="searchable-input"
                            />
                            <i v-if="formData.kpopGroup" class="bi bi-check-circle searchable-check"></i>
                            <div v-if="isGroupDropdownOpen" class="dropdown-menu">
                                <div
                                    v-for="group in filteredGroupsKpop"
                                    :key="group._id"
                                    @mousedown="selectGroupKpop(group)"
                                    class="dropdown-item"
                                >
                                    {{ group.name }}
                                </div>
                                <div v-if="filteredGroupsKpop.length === 0" class="dropdown-item disabled">
                                    Aucun groupe trouvé
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label for="kpopMember">
                            Membre
                            <span v-if="isMemberRequired" class="req">*</span>
                            <span v-else class="opt">(optionnel)</span>
                        </label>
                        <input type="text" id="kpopMember" v-model="formData.kpopMember" placeholder="Ex: Jimin, Lisa, Felix..." />
                        <small v-if="!isMemberRequired" class="form-hint">
                            Laissez vide pour un article de groupe.
                        </small>
                    </div>
                    <div>
                        <label for="albumName">Album <span class="opt">(optionnel)</span></label>
                        <div class="select-searchable">
                            <input
                                type="text"
                                id="albumName"
                                v-model="searchAlbumName"
                                @focus="isAlbumDropdownOpen = true"
                                @blur="closeAlbumDropdown"
                                :placeholder="formData.kpopGroup ? 'Rechercher dans les albums du groupe...' : 'Sélectionnez d\'abord un groupe'"
                                :disabled="!formData.kpopGroup"
                                class="searchable-input"
                            />
                            <i v-if="formData.albumName" class="bi bi-check-circle searchable-check"></i>
                            <div v-if="isAlbumDropdownOpen && formData.kpopGroup" class="dropdown-menu">
                                <div
                                    v-for="album in filteredAlbums"
                                    :key="album._id"
                                    @mousedown="selectAlbum(album)"
                                    class="dropdown-item"
                                >
                                    {{ album.name }}
                                </div>
                                <div v-if="filteredAlbums.length === 0" class="dropdown-item disabled">
                                    Aucun album trouvé pour ce groupe
                                </div>
                            </div>
                        </div>
                        <small v-if="!formData.kpopGroup" class="form-hint">Choisissez un groupe pour voir ses albums</small>
                    </div>
                </fieldset>

                <!-- Étape 4 : Livraison -->
                <fieldset v-show="currentStep === 4" class="form-section">
                    <legend><i class="bi bi-truck"></i> Livraison</legend>
                    <p class="form-intro">
                        Choisissez au moins une option d'expédition. Vous disposez de 5 jours ouvrés
                        pour expédier après le paiement.
                    </p>
                    <div class="shipping-options">
                        <label class="checkbox-card" :class="{ active: formData.shippingOptions.worldwide, disabled: formData.shippingOptions.nationalOnly }">
                            <input type="checkbox" v-model="formData.shippingOptions.worldwide" :disabled="formData.shippingOptions.nationalOnly" />
                            <i class="bi bi-globe2"></i>
                            <span>Mondiale</span>
                        </label>
                        <label class="checkbox-card" :class="{ active: formData.shippingOptions.nationalOnly, disabled: formData.shippingOptions.worldwide }">
                            <input type="checkbox" v-model="formData.shippingOptions.nationalOnly" :disabled="formData.shippingOptions.worldwide" />
                            <i class="bi bi-geo-alt"></i>
                            <span>Nationale</span>
                        </label>
                        <label class="checkbox-card" :class="{ active: formData.shippingOptions.localPickup }">
                            <input type="checkbox" v-model="formData.shippingOptions.localPickup" />
                            <i class="bi bi-shop"></i>
                            <span>Retrait local</span>
                        </label>
                    </div>
                    <div>
                        <label for="shippingCost">Frais de livraison</label>
                        <div class="input-with-addon">
                            <input type="number" id="shippingCost" v-model.number="formData.shippingOptions.shippingCost" step="0.01" min="0" placeholder="0.00" />
                            <span class="input-addon">€</span>
                        </div>
                        <small class="form-hint">
                            Laissez vide ou à 0 pour offrir les frais de port.
                        </small>
                    </div>

                    <label class="checkbox-inline">
                        <input type="checkbox" v-model="formData.allowOffers" />
                        <span>Accepter les offres de prix</span>
                    </label>
                    <small class="form-hint">
                        Les acheteurs pourront vous proposer un montant, que vous restez libre de
                        refuser.
                    </small>
                </fieldset>

                <!-- Étape 5 : Récapitulatif -->
                <fieldset v-show="currentStep === 5" class="form-section">
                    <legend><i class="bi bi-check2-square"></i> Récapitulatif</legend>

                    <div class="sell-recap">
                        <div class="sell-recap__media">
                            <img v-if="imagesPreview.length" :src="imagesPreview[0]" alt="Vignette de l'annonce" />
                            <div v-else class="sell-recap__media-empty"><i class="bi bi-image"></i></div>
                        </div>
                        <div class="sell-recap__body">
                            <h4 class="sell-recap__title">{{ formData.title || 'Sans titre' }}</h4>
                            <p class="sell-recap__price">
                                {{ formatPrice(formData.price) }}
                                <span v-if="formData.shippingOptions.shippingCost" class="sell-recap__shipping">
                                    + {{ formatPrice(formData.shippingOptions.shippingCost) }} de port
                                </span>
                                <span v-else class="sell-recap__shipping">· port offert</span>
                            </p>
                            <ul class="sell-recap__meta">
                                <li><i class="bi bi-tag"></i> {{ typeLabel }} · {{ conditionLabel }}</li>
                                <li v-if="searchGroupKpop"><i class="bi bi-music-note-beamed"></i> {{ searchGroupKpop }}<template v-if="formData.kpopMember"> — {{ formData.kpopMember }}</template></li>
                                <li><i class="bi bi-truck"></i> {{ shippingLabel }}</li>
                                <li><i class="bi bi-images"></i> {{ imagesPreview.length }} photo{{ imagesPreview.length > 1 ? 's' : '' }}</li>
                                <li>
                                    <i class="bi bi-chat-dots"></i>
                                    {{ formData.allowOffers ? 'Offres de prix acceptées' : 'Prix ferme' }}
                                </li>
                            </ul>
                        </div>
                    </div>


                    <div v-if="allBlockingIssues.length" class="sell-issues">
                        <p class="sell-issues__title">
                            <i class="bi bi-exclamation-circle"></i>
                            À compléter avant de publier :
                        </p>
                        <ul>
                            <li v-for="issue in allBlockingIssues" :key="issue.message">
                                <button type="button" @click="goToStep(issue.step)">
                                    {{ issue.message }}
                                    <i class="bi bi-arrow-right-short"></i>
                                </button>
                            </li>
                        </ul>
                    </div>

                    <p v-else class="sell-ready">
                        <i class="bi bi-check-circle-fill"></i>
                        Tout est prêt. En publiant, vous confirmez être propriétaire de l'article et
                        accepter les <router-link to="/cgu" target="_blank">CGU</router-link>.
                    </p>
                </fieldset>

                <!-- Erreur serveur -->
                <div v-if="errorMessage" class="form-error-message">
                    <i class="bi bi-exclamation-circle-fill"></i>
                    {{ errorMessage }}
                </div>


                <div v-if="stepError" class="form-error-message">
                    <i class="bi bi-exclamation-circle-fill"></i>
                    {{ stepError }}
                </div>

                <!-- Navigation -->
                <div class="sell-nav">
                    <button
                        v-if="currentStep > 1"
                        type="button"
                        class="btn-secondary"
                        @click="previousStep"
                    >
                        <i class="bi bi-arrow-left"></i> Retour
                    </button>
                    <span class="sell-nav__spacer"></span>
                    <button
                        v-if="currentStep < steps.length"
                        type="button"
                        class="btn-primary"
                        @click="nextStep"
                    >
                        Continuer <i class="bi bi-arrow-right"></i>
                    </button>
                    <button
                        v-else
                        class="btn-primary"
                        type="submit"
                        :disabled="saveLoading || allBlockingIssues.length > 0"
                    >
                        <i :class="saveLoading ? 'bi bi-hourglass-split' : (isModyfy ? 'bi bi-pencil' : 'bi bi-rocket-takeoff')"></i>
                        {{ saveLoading ? 'Envoi…' : (isModyfy ? 'Enregistrer les modifications' : 'Publier l\'annonce') }}
                    </button>
                </div>

                </form>
            </template>
        </div>

    </main>
  </template>

  <script lang="ts">
    import { defineComponent, ref, computed, watch, onMounted } from 'vue';
    import postService from '@/services/post.service';
    import  authentification from '@/services/authentification.service';
    import paymentService from '@/services/payment.service';
    import { Navigation, A11y } from 'swiper/modules';

    // Import Swiper Vue.js components
    import { Swiper, SwiperSlide } from 'swiper/vue';
    import { useRoute, useRouter } from "vue-router";

    // Import Swiper styles
    import 'swiper/css';
    import 'swiper/css/navigation';

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Cookies from "js-cookie";
    import axios from "axios";

    /** Découpage purement visuel : `formData` reste un objet unique. */
    const SELL_STEPS = [
        { id: 1, label: 'Photos' },
        { id: 2, label: 'Informations' },
        { id: 3, label: 'K-pop' },
        { id: 4, label: 'Livraison' },
        { id: 5, label: 'Vérification' }
    ] as const;

    const MAX_IMAGES = 10;

    const TYPE_LABELS: Record<string, string> = {
        photocard: 'Photocard',
        album: 'Album',
        merch: 'Merch',
        other: 'Autre'
    };

    const CONDITION_LABELS: Record<string, string> = {
        new: 'Neuf',
        likeNew: 'Comme neuf',
        good: 'Bon état',
        fair: 'État moyen',
        poor: 'Mauvais état'
    };

  export default defineComponent({
    name: 'add_post',
    components: {
        Nav_bar,
        Swiper,
        SwiperSlide,
    },
    props: {
        postData: {
            type: String,
            default: ''
        }
    },
    data(): {
      isDragOver: boolean;
    } {
      return {
        isDragOver: false,
      };
    },
    mounted() {
        authentification.verifSession().then(() => {

        });
    },

    setup(props) {
        const imagesPreview = ref<string[]>([]);
        const router = useRouter();
        const searchGroupKpop = ref('');
        const isGroupDropdownOpen = ref(false);
        const groupsKpopList = ref<any[]>([]);
        const searchAlbumName = ref('');
        const isAlbumDropdownOpen = ref(false);
        const albumsList = ref<any[]>([]);

        // Un vendeur ne peut publier que s'il peut réellement encaisser.
        // PayPal est le seul canal depuis le retrait de Stripe.
        const paypalOAuthConnected = ref(false);
        const loadingPaymentStatus = ref(true);
        const connectingPaypal = ref(false);

        const paymentConfigured = computed(() => paypalOAuthConnected.value);

        const checkPaymentConfiguration = async () => {
            try {
                loadingPaymentStatus.value = true;
                // `connected` reflète la capacité réelle à encaisser, pas la seule
                // présence d'un compte relié.
                const paypalStatus = await paymentService.getPayPalAccountStatus().catch(() => null);
                paypalOAuthConnected.value = Boolean(paypalStatus?.connected);
            } finally {
                loadingPaymentStatus.value = false;
            }
        };

        const connectPayPal = async () => {
            try {
                connectingPaypal.value = true;
                const result = await paymentService.getPayPalOnboardingLink();
                if (result.actionUrl) {
                    window.location.href = result.actionUrl;
                }
            } catch (error) {
                console.error('Erreur lors de la connexion PayPal:', error);
            } finally {
                connectingPaypal.value = false;
            }
        };

        checkPaymentConfiguration();

        const formData = ref({
            title: '',
            description: '',
            price: 0,
            currency: 'EUR',
            condition: 'new',
            category: '',
            type: 'photocard',
            kpopGroup: '',
            kpopMember: '',
            albumName: '',
            allowOffers: true,
            images: [] as File[],
            shippingOptions: {
                worldwide: false,
                nationalOnly: false,
                localPickup: false,
                shippingCost: null,
            },
        });

        const route = useRoute();
        let postDataObjet: any = null;
        const isModyfy = ref(false);

        // Get data from query params instead of props
        const postDataFromQuery = route.query.postData as string;
        if(postDataFromQuery && postDataFromQuery !== undefined && postDataFromQuery !== 'undefined'){
            try {
                postDataObjet = JSON.parse(postDataFromQuery);
                isModyfy.value = true;
            } catch (error) {
                console.error('Error parsing postData:', error);
            }
        }


        if (postDataObjet) {
            formData.value = { ...formData.value, ...postDataObjet };
            postDataObjet.images.forEach((image: string) => {
                const API_URL = import.meta.env.VITE_API_URL;
                const imgTmp = API_URL+image;
                imagesPreview.value.push(imgTmp);
            });
        }
        const getGroupKpopSelect = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups/search?query=${searchGroupKpop.value}`);
                return response.data.groups || [];
            } catch (error) {
                console.error('Erreur lors du chargement des groupes K-pop:', error);
                return [];
            }
        };


        const getAllGroupsKpop = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`);
                return response.data.groups || [];
            } catch (error) {
                console.error('Erreur lors du chargement des groupes K-pop:', error);
                return [];
            }
        };
        const selectAlbum = (album: any) => {
            formData.value.albumName = album._id;
            searchAlbumName.value = album.name;
            isAlbumDropdownOpen.value = false;
        };

        const closeAlbumDropdown = () => {
            setTimeout(() => {
                isAlbumDropdownOpen.value = false;
            }, 150);
        };


        // Charger tous les groupes K-pop au montage du composant
        (async () => {
            groupsKpopList.value = await getAllGroupsKpop();
        })();

        watch(searchGroupKpop, async (newValue) => {
            if (newValue && newValue.trim() !== '') {
                groupsKpopList.value = await getGroupKpopSelect();
            } else {
                groupsKpopList.value = await getAllGroupsKpop();
            }
        }, { immediate: false });

        const filteredGroupsKpop = computed(() => {
            return groupsKpopList.value;
        });
        const filteredAlbums = computed(() => {
            if (!searchAlbumName.value || searchAlbumName.value.trim() === '') {
                return albumsList.value;
            }
            const search = searchAlbumName.value.toLowerCase();
            return albumsList.value.filter((album: any) =>
                album.name.toLowerCase().includes(search)
            );
        });


        /** Ajoute des fichiers dans la limite de `MAX_IMAGES`. */
        const addImageFiles = (files: FileList | File[] | null | undefined) => {
            if (!files) return;

            const room = MAX_IMAGES - imagesPreview.value.length;
            if (room <= 0) {
                errorMessage.value = `Maximum ${MAX_IMAGES} photos par annonce.`;
                return;
            }

            const accepted = Array.from(files)
                .filter((file) => file.type.startsWith('image/'))
                .slice(0, room);

            for (const file of accepted) {
                formData.value.images.push(file);

                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        imagesPreview.value.push(e.target.result as string);
                    }
                };
                reader.readAsDataURL(file);
            }
        };

        const handleImageUpload = (event: Event) => {
            const input = event.target as HTMLInputElement;
            addImageFiles(input.files);
            input.value = '';
        };

        const removeImage = (index: number) => {
            formData.value.images.splice(index, 1);
            imagesPreview.value.splice(index, 1);
        };

        const triggerFileInput = () => {
            const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
            fileInput.click();
        };

        const errorMessage = ref('');
        const saveLoading = ref(false);

        // ── Progression et validation par étape ─────────────────────────────
        const currentStep = ref(1);
        const stepError = ref('');

        const currentStepMeta = computed(
            () => SELL_STEPS.find((step) => step.id === currentStep.value) ?? SELL_STEPS[0]
        );

        const canAddMoreImages = computed(() => imagesPreview.value.length < MAX_IMAGES);

        const isMemberRequired = computed(() => formData.value.type === 'photocard');

        /** Sert à la validation « Continuer » et au récapitulatif final. */
        const blockingIssuesForStep = (step: number): Array<{ step: number; message: string }> => {
            const data = formData.value;
            const issues: Array<{ step: number; message: string }> = [];

            if (step === 1 && imagesPreview.value.length === 0) {
                issues.push({ step: 1, message: 'Ajoutez au moins une photo.' });
            }

            if (step === 2) {
                if (!data.title?.trim()) issues.push({ step: 2, message: 'Donnez un titre à l\'annonce.' });
                if (!data.description?.trim()) issues.push({ step: 2, message: 'Décrivez l\'article.' });
                if (!(Number(data.price) > 0)) issues.push({ step: 2, message: 'Indiquez un prix supérieur à 0.' });
                if (!data.category?.trim()) issues.push({ step: 2, message: 'Renseignez une catégorie.' });
            }

            if (step === 3) {
                if (!data.kpopGroup) issues.push({ step: 3, message: 'Sélectionnez un groupe K-pop.' });
                if (isMemberRequired.value && !data.kpopMember?.trim()) {
                    issues.push({ step: 3, message: 'Indiquez le membre concerné par la photocard.' });
                }
            }

            if (step === 4) {
                const shipping = data.shippingOptions;
                if (!shipping.worldwide && !shipping.nationalOnly && !shipping.localPickup) {
                    issues.push({ step: 4, message: 'Choisissez au moins une option de livraison.' });
                }
            }

            return issues;
        };

        const allBlockingIssues = computed(() =>
            SELL_STEPS.flatMap((step) => blockingIssuesForStep(step.id))
        );

        const goToStep = (step: number) => {
            if (step > currentStep.value) return;
            stepError.value = '';
            currentStep.value = step;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const nextStep = () => {
            const issues = blockingIssuesForStep(currentStep.value);
            if (issues.length > 0) {
                stepError.value = issues[0].message;
                return;
            }
            stepError.value = '';
            currentStep.value = Math.min(currentStep.value + 1, SELL_STEPS.length);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const previousStep = () => {
            stepError.value = '';
            currentStep.value = Math.max(currentStep.value - 1, 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const formatPrice = (value: number | null | undefined) => {
            const amount = Number(value) || 0;
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: formData.value.currency || 'EUR'
            }).format(amount);
        };

        const typeLabel = computed(() => TYPE_LABELS[formData.value.type] ?? formData.value.type);
        const conditionLabel = computed(
            () => CONDITION_LABELS[formData.value.condition] ?? formData.value.condition
        );
        const shippingLabel = computed(() => {
            const shipping = formData.value.shippingOptions;
            const modes: string[] = [];
            if (shipping.worldwide) modes.push('mondiale');
            if (shipping.nationalOnly) modes.push('nationale');
            if (shipping.localPickup) modes.push('retrait local');
            return modes.length ? modes.join(', ') : 'aucune option choisie';
        });

        const save = async () => {
            errorMessage.value = '';
            saveLoading.value = true;
            let response = null;
            try {
                if(isModyfy.value){
                    response = await postService.updatePost(postDataObjet._id || postDataObjet.id, formData.value);
                }else{
                    response = await postService.createPost(formData.value);
                }
            } catch(e) {
                const err = e as { response?: { data?: { message?: string } }; message?: string };
                errorMessage.value = err?.response?.data?.message || err?.message || 'Erreur lors de la création du produit';
                saveLoading.value = false;
                return;
            }
            saveLoading.value = false;

            if (response == 'ok') {
                router.push({ name: 'profile' , params: { id: 'me' }});
            } else {
                errorMessage.value = response?.message || response?.error?.message || 'Erreur lors de la création du produit';
            }
        };

        const readFiles = (files: FileList | null | undefined) => {
            addImageFiles(files);
        };

        /** Renvoie sur la première étape fautive plutôt que de poster. */
        const onSubmit = () => {
            const issues = allBlockingIssues.value;
            if (issues.length > 0) {
                stepError.value = issues[0].message;
                currentStep.value = issues[0].step;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            stepError.value = '';
            return save();
        };
        const selectGroupKpop = (group: any) => {
            formData.value.kpopGroup = group._id;
            searchGroupKpop.value = group.name;
            isGroupDropdownOpen.value = false;
            // Reset album when group changes
            formData.value.albumName = '';
            searchAlbumName.value = '';
            albumsList.value = [];
            // Load albums for this group
            loadAlbumsForGroup(group._id);
        };

        const loadAlbumsForGroup = async (groupId: string) => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/albums/group/${groupId}`);
                albumsList.value = response.data.albums || response.data || [];
            } catch (error) {
                console.error('Erreur lors du chargement des albums du groupe:', error);
                albumsList.value = [];
            }
        };

        const closeGroupDropdown = () => {
            setTimeout(() => {
                isGroupDropdownOpen.value = false;
            }, 150);
        };


        return {
            formData,
            router,
            imagesPreview,
            handleImageUpload,
            removeImage,
            triggerFileInput,
            isModyfy,
            save,
            readFiles,
            searchGroupKpop,
            isGroupDropdownOpen,
            filteredGroupsKpop,
            selectGroupKpop,
            closeGroupDropdown,
            getGroupKpopSelect,
            searchAlbumName,
            isAlbumDropdownOpen,
            filteredAlbums,
            selectAlbum,
            closeAlbumDropdown,
            loadAlbumsForGroup,
            paypalOAuthConnected,
            paymentConfigured,
            loadingPaymentStatus,
            connectingPaypal,
            connectPayPal,
            errorMessage,
            saveLoading,
            // Progression et récapitulatif
            steps: SELL_STEPS,
            MAX_IMAGES,
            currentStep,
            currentStepMeta,
            stepError,
            canAddMoreImages,
            isMemberRequired,
            allBlockingIssues,
            goToStep,
            nextStep,
            previousStep,
            onSubmit,
            formatPrice,
            typeLabel,
            conditionLabel,
            shippingLabel,
        };

    },
    methods:{
        showToastError(message: string) {
            this.$func.showToastError(message);
        },
        showToastSuccess(message: string) {
            this.$func.showToastSuccess(message);
        },
        onDragOver() {
            this.isDragOver = true;
        },
        onDragLeave() {
            this.isDragOver = false;
        },
        onDrop(event:DragEvent) {
            const files = event.dataTransfer?.files;
            this.isDragOver = false;
            this.readFiles(files);
        },
    }
  });

  </script>

<style lang="scss" scoped>
@use '../../css/add_post.scss' as *;
</style>

