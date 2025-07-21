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
                <input type="text" id="kpopGroup" v-model="formData.kpopGroup" required />
            </div>
            <div>
                <label for="kpopMember">Membre Kpop</label>
                <input type="text" id="kpopMember" v-model="formData.kpopMember" required />
            </div>
            <div>
                <label for="albumName">Nom de l'album</label>
                <input type="text" id="albumName" v-model="formData.albumName" required />
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
            <div class="popup-buttons-footer">
                <button class="btn-primary" type="submit">Publier</button>
            </div>

            </form>
        </div>

    </main>
  </template>
  
  <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import postService from '@/services/post.js';
    import { Navigation, A11y } from 'swiper/modules';

    // Import Swiper Vue.js components
    import { Swiper, SwiperSlide } from 'swiper/vue';

    // Import Swiper styles
    import 'swiper/css';
    import 'swiper/css/navigation';
    
    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import Popup_add_item from '@/components/adherents/popup_add_item.vue';
    import Cookies from "js-cookie";
    import axios from "axios";

  export default defineComponent({
    name: 'add_poste',
    components: {
        Nav_bar,
        Popup_add_item,
        Swiper,
        SwiperSlide,
    },
    mounted() {
      this.$func.verifSession().then(() => {


    });
     

    },
    data(): { 
      isDragOver: boolean;
    } {
      return {
        isDragOver: false
      };
    },
    setup(props, { emit }) {
      const imagesPreview = ref<string[]>([]);

      const formData = ref({
        title: '',
        description: '',
        price: null,
        currency: 'EUR',
        condition: 'new',
        category: '',
        type: 'photocard',
        kpopGroup: '',
        kpopMember: '',
        albumName: '',
        images: [] as File[],
        shippingOptions: {
          worldwide: false,
          nationalOnly: false,
          localPickup: false,
          shippingCost: null,
        },
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
    
      return {
        formData,
        imagesPreview,
        handleImageUpload,
        removeImage,
        triggerFileInput,
      };
    },
    methods:{
        async save(){
            const response = await postService.createPost(this.formData);
            console.log(response);
            
            if (response) {
            this.$func.showToastSuccess('Produit créé avec succès !');

            this.$emit('close');
            }else{
            this.$func.showToastError('Erreur lors de la création du produit.');

            }
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
        readFiles(files: any) {
            const file = files[0];
            if (file) {
            this.formData.images.push(file);
    
            const reader = new FileReader();
        
            reader.onload = (e) => {
                if (e.target?.result) {
                    this.imagesPreview.push(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
            }
        },
    }
  });

  </script>
  
<style lang="scss" scoped>
    main{
        background: var(--light-color);
    }
    .content{
        background: white;
        width: 80%;
        padding: 20px;
    }
    form div {
        margin-bottom: 15px;
    }
  
    label {
        display: block;
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    input,
    textarea,
    select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    
    .image-drop-zone{
        background: var(--light-color);
        border: 2px dashed var(--primary-color);
        padding: 20px;
    }

    .image-preview-container {
        margin-bottom: 15px;
        border: 2px dashed var(--primary-color);
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
        
    }
    .add-image-slide {
        height: 100% !important;        /* Important pour écraser les styles Swiper */
    }
    .image-preview img{
        max-width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .image-preview i{
        background: var(--primary-color);
        padding-left: 7px;
        padding-right: 7px;
        padding-top: 4px;
        border-radius: 50%;
        height: 30px;
        width: 30px;
    }

    .image-swiper {
        height: 120px; // ou la hauteur souhaitée pour tous les slides
    }
    /* Le bouton doit aussi remplir le slide */
    .add-image-button {
        width: 100%;
        height: 100%;
        min-height: 100%;
        font-size: 2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
    }
    .image-preview-container div{
        margin-bottom: 0px;
    }
    
    .image-preview {
        flex: 0 0 auto; 
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 4px;
        overflow: hidden;
        display: block;
        justify-content: center;
        align-items: center;
        margin-top: auto;
        margin-bottom: auto;
        padding-right: 10px;
        padding-left: 10px;
    }
    .delete_img{
        position: absolute; 
        right: 5px; 
        top: 0px; 
        color: white;  
        border-radius: 4px; 
        cursor: pointer;
    }
    .delete_img:hover{
        color: var(--primary-color);  
    }
    .image-preview img {
        max-width: 100%;
        height: 100%;
    }

    .image-preview button {
        position: absolute;
        top: 5px;
        right: 5px;
        background: red;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        cursor: pointer;
        font-size: 12px;
        line-height: 20px;
        text-align: center;
    }
    .popup-buttons-footer button{
        width: 100%;
        margin: 2%;
    }
    .disabled {
        opacity: 0.5; 
        pointer-events: none; 
    }
    input[type="checkbox"] {
        appearance: none;
        width: 20px;
        height: 20px;
        margin-right: 10px; 
        border: 2px solid var(--primary-color); 
        border-radius: 4px; 
        background-color: white; 
        cursor: pointer;
        display: inline-block;
        vertical-align: middle;
        position: relative; 
    }

    input[type="checkbox"]:checked {
        background-color: var(--primary-color);
        border-color: var(--primary-color); 
        color: white;
    }
    input[type="checkbox"]:checked::after {
        content: '✔';
        color: white; 
        font-size: 14px; 
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%); 
        font-weight: bold;
        line-height: 1; 
    }
@media (max-width: 769px) {
    .content{
        background: white;
        width: 100%;
        padding: 20px;
    }
}
</style>
  