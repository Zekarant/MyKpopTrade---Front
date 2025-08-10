<template>
    <div class="popup-overlay" @click.self="$emit('close')">
      <div class="popup-content">
        <h3>Ajouter un post</h3>
        <form @submit.prevent="save">
          <div>
            <label for="title">Titre</label>
            <input type="text" id="title" v-model="formData.title" required />
          </div>
          <div>
            <label for="description">Description</label>
            <textarea id="description" v-model="formData.description" required></textarea>
          </div>
          <div>
          <label for="images">Images</label>
          <div class="image-preview-container">
            <div v-for="(image, index) in imagesPreview" :key="index" class="image-preview">
              <img :src="image" alt="Aperçu de l'image" />
              <i  @click="removeImage(index)" class="bi bi-trash delete_img"></i>
            </div>
          </div>
          <input type="file" id="imageUpload" @change="handleImageUpload" accept="image/*" hidden />
          <button class="btn-primary" type="button" @click="triggerFileInput">Ajouter une image</button>
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
            <button class="btn-danger-outline" type="button" @click="$emit('close')">Fermer</button>
            <button class="btn-primary" type="submit">Publier</button>
          </div>

        </form>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import postService from '@/services/post.service';

  export default defineComponent({
    name: 'PopupAddItem',
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
      }
    }
  });
  </script>
  
  <style scoped>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .popup-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 400px;
    max-height: 90%;
    overflow-y: auto;
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
  


  .image-preview-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
  }

.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
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
  max-height: 100%;
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
  width: 48%;
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

</style>