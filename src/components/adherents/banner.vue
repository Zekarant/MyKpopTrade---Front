<template>
    <div @click="closeMenu" class="content">
        <div class="background"></div>
        <div @click="triggerFileInput"  v-if="admin" class="picture">
            <img v-if="profilInfo.profilePicture" :src="profilePictureUrl || undefined" alt="Profile Picture" />
            <div v-else class="empty-profile">
                <i class="bi bi-camera"></i>
            </div>
            <i  v-if="profilInfo.profilePicture" @click="deletePicturePopup($event)" style="position: absolute; right: 0px; bottom: 0px; color: white; background: #0000005c; border-radius: 4px; cursor: pointer;"  class="bi bi-trash"></i>
            <input type="file" ref="fileInput" @change="updatePicture" accept="image/*" style="display: none;" />
        </div>
        <div  v-else class="picture">
            <img v-if="profilInfo.profilePicture" :src="profilInfo.profilePicture" alt="Profile Picture" />
        </div>
        <div class="profil">
            <div class="row row_profil" style="height: 100%; ">
                <div class="empty_box"></div>
                <div class="row row_name">
                    <div class="container_nickname col-md-4">
                        <div class="nickname">
                            <div class="nickname_block">
                                <span class="nickname_text_field">Surnom</span>
                            </div>
                            <div v-if="profilInfo.isIdentityVerified" class="img_certif_container">
                                <img src="@/assets/images/certif.svg">
                            </div>
                        </div>
                        <div class="identifier">@{{ profilInfo.username }}</div>
                    </div>
                    <div class="container_infos col-md-6">
                        <div class="row">
                            <div class="col-md-5 subscription">
                                <span class="bold">00</span> Abonnements
                            </div>
                            <div class="col-md-5 subscription">
                                <span class="bold">00</span> Abonnés

                            </div>
                            <div class="col-md-1 more_content" @click="toggleMenu($event)">
                                <i class="bi bi-three-dots-vertical"></i>
                                <div v-if="isMenuVisible" class="dropdown-menu">
                                    <ul v-if="admin">
                                        <li @click="openSettings">
                                            <i class="bi bi-gear me-2"></i> Paramètres
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <br>
                        <div class="row">
                            <div class="col-md-7">
                                <button v-if="!isYouProfil" style="font-size: 12px;" type="button" class="btn btn-outline">Envoyer un message</button>
                            </div>
                            <div class="col-md-5">
                                <button v-if="!isYouProfil" style="font-size: 12px;" type="button" class="btn btn-primary">Suivre</button>
                            </div>
                        </div>
                    </div>
                    <div class="container_infos col-md-2"></div>
                </div>

            </div>
        </div>
    </div>


    <!--------- Popup ---------->
    <div v-if="showDeletePictureConfirmation "class="popup-overlay">
    <div class="popup-content">
        <p>Voulez-vous vraiment supprimer votre photo de profil ?</p>
        <div class="popup-buttons-footer">
            <button class="btn btn-primary-outline" @click="deletePicturePopup">Annuler</button>
            <button class="btn btn-danger" @click="confirmDeletePicture">Supprimer</button>
        </div>
    </div>
</div>
</template>


<script lang="ts">
    import { useRoute, useRouter } from "vue-router";
    import axios from 'axios';
    import Cookies from "js-cookie";

    export default {
        name: "banner",
        data() {
            return {
                modify: false,
                isYouProfil: false,
                isMenuVisible: false,
                showDeletePictureConfirmation: false, 

            };
        },
        setup() {
            const route = useRoute();
            const router = useRouter();



            const openSettings = () => {

            };
            return {
                route,
                router,
                openSettings,
            };
        },
        mounted() {
            const id = this.route.params.id; // Récupère l'ID passé en paramètre
            //récupérer l'id dans l'url et vérifier l'id de l'user si est pareille que l'id en session 
            if(this.route.name =='profile' && id == '0'){
                this.isYouProfil = true;
            }
        },
        methods: {
            toggleMenu(event: Event){
                event.stopPropagation();
                this.isMenuVisible = !this.isMenuVisible;
            },
            closeMenu(){
                this.isMenuVisible = false;
            },
            triggerFileInput() {
                const fileInput = this.$refs.fileInput as HTMLInputElement;
                fileInput.click();
            },
            async updatePicture(event: Event) {
                const file = (event.target as HTMLInputElement).files?.[0];
          
                if (file) {
                    console.log(file);

                    var formData = new FormData();

                    formData.append('profilePicture', file);
                    console.log('Contenu de FormData :', Array.from(formData.entries()));
                    const PHPSESSID = Cookies.get('PHPSESSID');
                    console.log(formData);
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/me/picture`, formData, {
                        headers: {
                        'Content-Type': 'multipart/form-data.',
                        'Authorization': `Bearer ${PHPSESSID}` // Ajout du Bearer Token

                        }
                    }).then(response => {

                    if (response.status === 200) {
                        this.profilInfo.profilePicture = URL.createObjectURL(file);

                    }
                    }).catch(error => {
                        if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.logout();
                        }
                        console.log(error);
                    });
                }
            },
            editProfile() {
                this.modify = true;
            },
            deletePicturePopup(event: Event){
                event.stopPropagation();
                this.showDeletePictureConfirmation = !this.showDeletePictureConfirmation;
            },
            confirmDeletePicture() {
                const PHPSESSID = Cookies.get('PHPSESSID');
                axios.delete(`${import.meta.env.VITE_API_URL}/api/profiles/me/picture`, {
                    headers: {
                        'Authorization': `Bearer ${PHPSESSID}`,
                    },
                }).then(() => {
                    this.profilInfo.profilePicture = null; // Supprime localement l'image
                    this.showDeletePictureConfirmation = false; // Ferme la boîte de dialogue
                })
                .catch((error) => {
                    console.error(error);
                    if(error.response.data.message == "Token invalide" || error.response.data.code == "TOKEN_EXPIRED"){
                        this.$func.logout();
                    }
                });
            },
            
        },
        computed: {
            profilePictureUrl() {
                const baseUrl = import.meta.env.VITE_API_URL; // Récupère le nom de domaine depuis les variables d'environnement
                return this.profilInfo.profilePicture
                ? `${baseUrl}${this.profilInfo.profilePicture}`
                : null;
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
    height:100%;
    border-bottom: 0.5px solid var(--secondary-color-tint)
}
.profil{
    height:100%;
}
.background{
    background: var(--primary-color);
    width:100%;
    max-width: 100vw;
    height:50%;
}
.picture{
    height: 130px;
    width: 130px;
    background: var(--primary-color);
    border-radius: 4px;
    border: 4px solid white;
    position: absolute;
    top: 15%;
    left: 30%;
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
  font-size: 3rem; /* Ajustez la taille de l'icône */
  color: white; 
}
.empty_box{
   width: calc(30% + 40px);
   height:100%;
   margin:0px;
   padding:0px
}
.row_name{
    width:calc(70% - 40px);
    height:100%;
    margin:0px;
    padding:0px;
    padding-top: 5px;
}
.container_infos{

}
.nickname_block{
    display: inline-block;
}
.img_certif_container{
    display: inline-block;
    width: 10px;
}
.img_certif_container img{
    width: 100%;
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
    /*font-size: 10px;*/
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
    text-align: right;
}
.subscription .bold{
    color: var(--primary-color);
}
.more_content {
  position: relative;
  cursor: pointer;
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

@media (max-width: 768px) {
    .picture{
        top: 15%;
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
        width: 100vw;
        padding-top: calc(calc(130px + 5%) / 2);
    }
    .row_profil{
        height: auto !important;
        width: 100vw !important;
    }
    .row_name{
        width: 100%;
    }
  
    .row-banner{
        width: 100% !important;
    }
    .subscription, .more_content, .nickname, .identifier{
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