<template>
   <div class="container_detail_card">
        <div  class="card">
            <div class="post_card_content">
                <div class="post_card_content_header">
                    <div class="userPicture">
                        <img :src="profilePictureUrl || undefined">
                    </div>
                    <div>
                        <div class="identifier">@{{ dataSeller.username }}</div>

                        <div v-if="dataSeller.isIdentityVerified" class="img_certif_container">
                            <img src="@/assets/images/certif.svg">
                        </div>
                    </div>
                    <div class="col-md-1 more_content" @click="toggleMenu($event)">
                        <i class="bi bi-three-dots-vertical"></i>
                            <div v-if="isMenuVisible" class="dropdown-menu">
                                <ul>
                                    <li>
                                        <i class="bi bi-pencil me-2"></i>
                                        Signaler
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
                                <p>{{ dataPost.condition.charAt(0).toUpperCase() + dataPost.condition.slice(1) }}</p>
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
                        <div class="bloc_detail shippingOptions">
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
                            {{ dataPost.type.charAt(0).toUpperCase() + dataPost.type.slice(1) }}
                        </div>
                    </div>
                </div>
                <div v-if="!dataPost.isReserved" class="post_card_content_footer">
                    <button v-if="dataPost.allowOffers" class="btn-blue-outline" type="button">Faire une offre</button>
                    <button class="btn-blue-outline" type="button">Acheter</button>
                    <button class="btn-blue-outline" type="button">Envoyer un message</button>
                </div>
            </div>
            <div class="illustration">
                <div v-if="dataPost.isReserved" class="banner_reserved">
                    <div class="state">Réservé</div>
                </div>
                <ImageCarousel :images="dataPost.images" />
            </div>
        </div>

    </div>
</template>
  

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import axios from 'axios';
    import card_illu from '../components/card_illu.vue';
    import ImageCarousel from '../components/ImageCarousel.vue';
    
    export default defineComponent({
        name: "post",
        components: {
            card_illu,
            ImageCarousel
        },
        props: {
            dataPost: {
                type: Object as () => { currency: string; [key: string]: any },
                required: true,
            },
            dataUser: {
                type: Object,
                required: false,
            },
        },
        data() {
            return {
                dataSeller: {} as Record<string, any>,
                isMenuVisible: false,
            };
        },
        mounted() {
            console.log(this.dataPost);
            if(this.dataUser) {
                this.dataSeller = this.dataUser;
            }else{
                this.dataSeller = this.dataPost.seller;
            }
            console.log(this.dataSeller);
        },
        computed: {
            profilePictureUrl() {
                const baseUrl = import.meta.env.VITE_API_URL; // Récupère le nom de domaine depuis les variables d'environnement
                return this.dataSeller.profilePicture
                ? `${baseUrl}${this.dataSeller.profilePicture}`
                : null;
            },
            currencySymbol() {
                const symbols = {
                    EUR: '€',
                    USD: '$',
                    KRW: '₩',
                    JPY: '¥',
                    GBP: '£',
                };
                return symbols[this.dataPost.currency as keyof typeof symbols] || ''; // Retourne le symbole ou une chaîne vide si non défini
            },
        },
        methods: {
            toggleMenu(event: Event){
                event.stopPropagation();
                this.isMenuVisible = !this.isMenuVisible;
            },
        },
        watch: {
            dataPost(newValue, oldValue) {
                console.log('Données mises à jour:', { oldValue, newValue });
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
    }
    .post_card_detail b{
        font-size:medium; 
        color: var(--blue); 
        margin-bottom: 20px;
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
        justify-content: space-between;
        overflow-x: scroll;
    }
    .post_card_content_header, .post_card_content_header div{
        display: flex;
    }
    .post_card_content_header, .post_card_detail, .post_card_content_footer{
        margin: 15px;
    }

    .userPicture img{
        width: 100%;
        height: 100%;
        object-fit: contain;
        background-color: var(--primary-color);
        border-radius: 3px;
    }
    .userPicture{
        height: 40px;
        width: 40px;
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
        }
        .post_card_content_footer button{
            width: 100%;
        }
    }
  </style>
  