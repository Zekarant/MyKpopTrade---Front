<template>
    <main class="page">
        <Nav_bar></Nav_bar>
        <div class="content imgcenter">
            <h3><i class="bi bi-plus-circle"></i> {{ isModyfy ? 'Modifier l\'annonce' : 'Nouvelle annonce' }}</h3>
            <form @submit.prevent="save">

            <!-- === Section Images === -->
            <fieldset class="form-section">
                <legend><i class="bi bi-images"></i> Photos</legend>
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
                                <i @click.stop="removeImage(index)" class="bi bi-trash delete_img"></i>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="add-image-slide">
                            <button style="height: 100%; margin-left: 10px;" class="btn-primary" type="button">+</button>
                        </swiper-slide>
                    </swiper>
                </div>
                <input type="file" id="imageUpload" @change="handleImageUpload" accept="image/*" hidden ref="fileInput" />
                <small class="form-hint">{{ imagesPreview.length }}/10 photos · JPG, PNG</small>
            </fieldset>

            <!-- === Section Informations principales === -->
            <fieldset class="form-section">
                <legend><i class="bi bi-tag"></i> Informations</legend>
                <div>
                    <label for="title">Titre de l'annonce</label>
                    <input type="text" id="title" v-model="formData.title" placeholder="Ex: Photocard Jimin BE Lucky Draw" required />
                </div>
                <div>
                    <label for="description">Description</label>
                    <textarea id="description" v-model="formData.description" placeholder="Décrivez l'état, l'authenticité, les détails..." required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <label for="price">Prix</label>
                        <div class="input-with-addon">
                            <input type="number" id="price" v-model="formData.price" step="0.01" min="0" required />
                            <select class="input-addon" v-model="formData.currency">
                                <option value="EUR">€</option>
                                <option value="USD">$</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-col">
                        <label for="condition">État</label>
                        <select id="condition" v-model="formData.condition" required>
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
                        <label for="type">Type d'article</label>
                        <select id="type" v-model="formData.type" required>
                            <option value="photocard">Photocard</option>
                            <option value="album">Album</option>
                            <option value="merch">Merch</option>
                            <option value="other">Autre</option>
                        </select>
                    </div>
                    <div class="form-col">
                        <label for="category">Catégorie</label>
                        <input type="text" id="category" v-model="formData.category" placeholder="Ex: Photocard, Lightstick..." required />
                    </div>
                </div>
            </fieldset>

            <!-- === Section K-pop === -->
            <fieldset class="form-section">
                <legend><i class="bi bi-music-note-beamed"></i> K-pop</legend>
                <div>
                    <label for="kpopGroup">Groupe</label>
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
                    <label for="kpopMember">Membre</label>
                    <input type="text" id="kpopMember" v-model="formData.kpopMember" placeholder="Ex: Jimin, Lisa, Felix..." required />
                </div>
                <div>
                    <label for="albumName">Album</label>
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

            <!-- === Section Livraison === -->
            <fieldset class="form-section">
                <legend><i class="bi bi-truck"></i> Livraison</legend>
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
                        <input type="number" id="shippingCost" v-model="formData.shippingOptions.shippingCost" step="0.01" min="0" placeholder="0.00" />
                        <span class="input-addon">€</span>
                    </div>
                </div>
            </fieldset>

            <!-- === Section Options === -->
            <fieldset class="form-section">
                <legend><i class="bi bi-gear"></i> Options</legend>
                <label class="checkbox-inline">
                    <input type="checkbox" v-model="formData.allowOffers" />
                    <span>Accepter les offres de prix</span>
                </label>
            </fieldset>

            <!-- === Submit === -->
            <div class="popup-buttons-footer">
                <button class="btn-primary" type="submit">
                    <i :class="isModyfy ? 'bi bi-pencil' : 'bi bi-rocket-takeoff'"></i>
                    {{ isModyfy ? 'Enregistrer les modifications' : 'Publier l\'annonce' }}
                </button>
            </div>

            </form>
        </div>

    </main>
  </template>

  <script lang="ts">
    import { defineComponent, ref, computed, watch } from 'vue';
    import postService from '@/services/post.service';
    import  authentification from '@/services/authentification.service';
    import { Navigation, A11y } from 'swiper/modules';

    // Import Swiper Vue.js components
    import { Swiper, SwiperSlide } from 'swiper/vue';
    import { useRoute, useRouter } from "vue-router";

    // Import Swiper styles
    import 'swiper/css';
    import 'swiper/css/navigation';

    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import Cookies from "js-cookie";
    import axios from "axios";

  export default defineComponent({
    name: 'add_post',
    components: {
        Nav_bar,
        Popup_add_item,
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
                let API_URL = import.meta.env.VITE_API_URL;
                let imgTmp = API_URL+image;
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


        const handleImageUpload = (event: Event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
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

        const removeImage = (index: number) => {
            formData.value.images.splice(index, 1);
            imagesPreview.value.splice(index, 1);
        };

        const triggerFileInput = () => {
            const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
            fileInput.click();
        };

        const save = async () => {
            var response = null;
            if(isModyfy.value){
                response = await postService.updatePost(postDataObjet.id,formData.value);
            }else{
                response = await postService.createPost(formData.value);
            }

            if (response == 'ok') {
                // Note: $func is not available in setup, you'll need to handle this differently
                //this.showToastSuccess('Produit créé avec succès !');
                router.push({ name: 'profile' , params: { id: 'me' }});
            } else {
                const alert = document.createElement('div');
                alert.className = 'alert error-alert';
                alert.innerText = response.message || response.error.message || 'Erreur lors de la création du produit';
                document.body.appendChild(alert);
                setTimeout(() => {
                    alert.remove();
                }, 3000);
            }
        };

        const readFiles = (files: any) => {
            const file = files[0];
            if (file) {
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
