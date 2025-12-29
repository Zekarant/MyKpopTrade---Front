<template>
    <main>
        <Nav_bar></Nav_bar>        
        <div class="content imgcenter">
            <h3>Ajouter un post</h3>
            <form @submit.prevent="save">
            <div>
                <label for="images">Images</label>

                <!-- Zone Drag & Drop -->
                <div v-if="imagesPreview.length == 0" class="image-drop-zone" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave="onDragLeave"  @drop.prevent="onDrop" :class="{ 'drag-over': isDragOver }">
                    <button class="btn-primary imgcenter"  type="button" >
                        Ajouter une image ou déposer
                    </button>

                </div>
                <div v-else class="image-preview-container" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave="onDragLeave"  @drop.prevent="onDrop" :class="{ 'drag-over': isDragOver }">
                    <swiper 
                        class="image-swiper"
                        :slides-per-view="5"
                        :breakpoints="{
                            0: { slidesPerView: 2 },
                            720: { slidesPerView: 2 },
                            980: { slidesPerView: 4 }
                        }"
                        >
                        <swiper-slide v-for="(image, index) in imagesPreview" :key="index">
                            <div class="image-preview">
                                <img class="imgcenter" :src="image" alt="Aperçu de l'image" />
                                <i @click="removeImage(index)" class="bi bi-trash delete_img"></i>
                            </div>
                        </swiper-slide>
                        <swiper-slide class="add-image-slide">
                            <button style="height: 100%;  margin-left: 10px;" class="btn-primary" type="button">+</button>
                        </swiper-slide>
                    </swiper>
                </div>
                <!-- input caché + bouton -->
                <input
                    type="file"
                    id="imageUpload"
                    @change="handleImageUpload"
                    accept="image/*"
                    hidden
                    ref="fileInput"
                />

            </div>
  
            <div>
                <label for="title">Titre</label>
                <input type="text" id="title" v-model="formData.title" required />
            </div>
            <div>
                <label for="description">Description</label>
                <textarea id="description" v-model="formData.description" required></textarea>
            </div>
            <div>
                <label for="price">Prix</label>
                <input type="number" id="price" v-model="formData.price" step="0.01" required />
            </div>
            <div>
                <label for="currency">Devise</label>
                <select id="currency" v-model="formData.currency">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                </select>
            </div>
            <div>
                <label for="condition">État</label>
                <select id="condition" v-model="formData.condition" required>
                <option value="new">Neuf</option>
                <option value="likeNew">Comme neuf</option>
                <option value="good">Bon état</option>
                <option value="fair">État moyen</option>
                <option value="poor">Mauvais état</option>
                </select>
            </div>
            <div>
                <label for="category">Catégorie</label>
                <input type="text" id="category" v-model="formData.category" required />
            </div>
            <div>
                <label for="type">Type</label>
                <select id="type" v-model="formData.type" required>
                <option value="photocard">Photocard</option>
                <option value="album">Album</option>
                <option value="merch">Merch</option>
                <option value="other">Autre</option>
                </select>
            </div>

            <div>
                <label for="kpopGroup">Groupe Kpop</label>
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
                <label for="kpopMember">Membre Kpop</label>
                <input type="text" id="kpopMember" v-model="formData.kpopMember" required />
            </div>
            <div>
                <label for="albumName">Nom de l'album</label>
                <div class="select-searchable">
                    <input 
                        type="text" 
                        id="albumName"
                        v-model="searchAlbumName"
                        @focus="isAlbumDropdownOpen = true"
                        @blur="closeAlbumDropdown"
                        placeholder="Rechercher un album..."
                        class="searchable-input"
                    />
                    <div v-if="isAlbumDropdownOpen" class="dropdown-menu">
                        <div 
                            v-for="album in filteredAlbums" 
                            :key="album._id"
                            @mousedown="selectAlbum(album)"
                            class="dropdown-item"
                        >
                            {{ album.name }} - {{ album.artistName }}
                        </div>
                        <div v-if="filteredAlbums.length === 0" class="dropdown-item disabled">
                            Aucun album trouvé
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label for="allowOffers">Accepter les offres <input type="checkbox" id="allowOffers" v-model="formData.allowOffers" /></label>
            </div>
            
            <div>
                <label>Options de livraison</label>
                <div :class="{ disabled: formData.shippingOptions.nationalOnly }">
                <label style="font-weight: normal;">
                    Livraison mondiale
                    <input style="width: auto;" type="checkbox" v-model="formData.shippingOptions.worldwide" />
                </label>
                </div>
                <div :class="{ disabled: formData.shippingOptions.worldwide}">
                <label style="font-weight: normal;">
                    Livraison nationale uniquement
                    <input style="width: auto;" type="checkbox" v-model="formData.shippingOptions.nationalOnly" />
                </label>
                </div>
                <div>
                <label style="font-weight: normal;">
                    Retrait local
                    <input style="width: auto;" type="checkbox" v-model="formData.shippingOptions.localPickup" />
                </label>
                </div>
                <div>
                <label for="shippingCost">Coût de livraison</label>
                <input type="number" id="shippingCost" v-model="formData.shippingOptions.shippingCost" step="0.01" />
                </div>
            </div>
            
            <div v-if="isModyfy" class="popup-buttons-footer">
                <button class="btn-primary" type="submit">Modifier</button>
            </div>
            <div v-else class="popup-buttons-footer">
                <button class="btn-primary" type="submit">Publier</button>
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
        const getAllAlbums = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/albums?page=1&limit=100&sortBy=releaseDate&sortOrder=asc`);
                return response.data.albums || [];
            } catch (error) {
                console.error('Erreur lors du chargement des albums:', error);
                return [];
            }
        };

        const searchAlbums = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/albums?page=1&limit=100&sortBy=releaseDate&sortOrder=asc`);
                const allAlbums = response.data.albums || [];
                return allAlbums.filter((album: any) =>
                    album.name.toLowerCase().includes(searchAlbumName.value.toLowerCase()) ||
                    album.artistName.toLowerCase().includes(searchAlbumName.value.toLowerCase())
                );
            } catch (error) {
                console.error('Erreur lors de la recherche des albums:', error);
                return [];
            }
        };

        const selectAlbum = (album: any) => {
            formData.value.albumName = album._id;
            searchAlbumName.value = `${album.name} - ${album.artistName}`;
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
        (async () => {
            albumsList.value = await getAllAlbums();
        })();

        watch(searchGroupKpop, async (newValue) => {
            if (newValue && newValue.trim() !== '') {
                groupsKpopList.value = await getGroupKpopSelect();
            } else {
                groupsKpopList.value = await getAllGroupsKpop();
            }
        }, { immediate: false });

        watch(searchAlbumName, async (newValue) => {
            if (newValue && newValue.trim() !== '') {
                albumsList.value = await searchAlbums();
            } else {
                albumsList.value = await getAllAlbums();
            }
        }, { immediate: false });

        const filteredGroupsKpop = computed(() => {
            return groupsKpopList.value;
        });
        const filteredAlbums = computed(() => {
            return albumsList.value;
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