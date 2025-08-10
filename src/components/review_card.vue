<template v-if="!review.isHidden">
    <div v-bind="$attrs" @click="closeMenu" class="container_detail_card">
        <div style="font-size: small;">Posté le {{ formatDate(review.createdAt) }}</div>
        <div class="card">
            <div class="review_card_content">
                <div class="review_card_content_header">
                    <div class="picture_profile_review">
                        <img :src="getUrlImage(review.reviewer.profilePicture)" alt="Profile Picture" />
                    </div>
                    <div class="review_card_content_header_content">
                        <div class="reviewer_username">
                            <span>@{{ review.reviewer.username }}</span>
                        </div>
                        <div class="reviewer_rating">
                            <i style="color: #FFD485;margin-left: 8px;" class="bi bi-star-fill"></i>
                            <span class="rating_number">{{ review.rating }}</span>
                        </div>
                    </div>
                    <i @click="toggleMenu($event)" style="position: absolute; right: 0px;top: 10px; cursor: pointer;" class="bi bi-three-dots-vertical"></i>
                    <div v-if="isMenuVisible" class="dropdown-menu">
                    <ul style="width: 100%;">
                        <li @click="showPopupReport = true">
                            <i class="bi bi-signal me-2"></i>
                                Signaler
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="review_card_content_text">
                    <div class="review_text">{{ review.review }}</div>
                </div>
                    
            </div>
            <div class="illustration">
                <ImageCarousel :images="review.images" />
            </div>
        </div>
    </div>
    <!--------- Popup ---------->
    <report_card @closeReport="showPopupReport = false" :type="'rating'" :id="review._id" v-if="showPopupReport"></report_card>


</template>
  
  <script lang="ts">
    import ImageCarousel from '../components/ImageCarousel.vue';
    import report_card from '../components/report_card.vue';
    import axios from 'axios';
    import Cookies from "js-cookie";

    export default {

        name: "review_card",
        components: {
            ImageCarousel,
            report_card

        },
        inheritAttrs: false, 

        props: {
            review: {
                type: Object,
                required: true,
            },
        },
        data() {
            return {
                isMenuVisible: false,
                showPopupReview: false,
                signalReason: '', 
                showPopupReport:false

            };
        },
        methods: {
            toggleMenu(event: MouseEvent) {
                event.stopPropagation();
                this.isMenuVisible = !this.isMenuVisible;
                console.log(this.isMenuVisible);

            },
            closeMenu() {
                this.isMenuVisible = false;
                this.showPopupReview = false;
            },
            closePopup() {
                this.showPopupReview = false;
            },
            async sendSignal(reason: string) {
                const sessionToken = Cookies.get('sessionToken');
                let id_review = this.review._id;
                let data = {
                    'reason': reason,
                };
                
                await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/ratings/${id_review}/report`, data, {
                    headers: {
                    Authorization: `Bearer ${sessionToken}`,
                    }
                }).then(response => {
                    if (response.status == 201 || response.status == 200) {
                        //return true;
                        this.closePopup();
                    }else {
                        console.error("Error reporting review:", response);
                    }

                }).catch(error => {
                    //return false;
                });
            },
            getUrlImage(url: string) {
                if (url.startsWith('http')) {
                    return url;
                } else {
                    return `${import.meta.env.VITE_API_URL}${url}`;
                }
            },
            formatDate(dateString: string) {
                const date = new Date(dateString);
                return date.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }) + ' à ' + date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            },
        },
    };

  </script>
  
  <style lang="scss" scoped>
    .card{
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        height: 300px;
        position: relative;
    }
    .review_card_content_header{
        display: flex;
    }
    .reviewer_username{
        vertical-align: middle;
        margin-left: 10px;
    }
    .reviewer_rating{

    }
    .inputReason{
        width: calc(98% - 2px);
        margin-left: 1%;
        margin-right: 1%;
        border: 2px solid var(--secondary-color-tint);
        border-radius: 4px;
    }
    .review_card_content_header_content{
        margin-top: 10px;
    }
    .dropdown-menu{
        display: block;
    }

    .review_card_content{
        height: 100%;
        width: 50%;
        flex-direction: column; 
        display: flex;
        justify-content: space-between;
        overflow-x: scroll;
        position: relative;
    }

    .review_card_content_text{
        margin-top: 10px;
        margin-left: 10px;
        height: 100%; // ou une hauteur explicite si besoin
        display: flex;
        flex-direction: column;
    }
    .review_text{
        font-size: small;
        padding-bottom: 15px;
        max-height: 60%; // ou la valeur que tu veux
        overflow-y: auto;
        word-break: break-word;
        padding-right: 3px;
    }
    .review_text::-webkit-scrollbar {
        width: 8px;
        background: #eee;
    }
    .review_text::-webkit-scrollbar-thumb {
        background: #bdbdbd;
        border-radius: 4px;
    }
    .illustration{
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 50%;
        align-items: center;
        justify-content: center;
        background: black;
        position: relative;
        margin: 10px;
        border-radius: 5px;
    }
    .picture_profile_review{
        height: 80px;
        width: 80px;
        margin-left: 10px;
        margin-top: 10px;
        background-color: var(--primary-color);
    }
    .picture_profile_review img{
        width: 100%;
    }
    @media (max-width:980px){
        .container_detail_card .card{
            flex-direction: column-reverse;
        }
    }
    @media (max-width:820px){
        .review_card_content{
            width: 100%;
            height: auto;
        }
        .illustration{
            width: 100%;
            height: 30vh;      // 30% de la hauteur de la fenêtre (ou adapte à 30% du parent si besoin)
            max-height: 30%;
            min-height: 100px;
        }
        .container_detail_card{
            height: 90%;
        }
        .review_card_content, .container_detail_card .card, .review_text{
            overflow: hidden;
        }
        .container_detail_card .card {
            flex-direction: column-reverse;
            height: auto !important;
            min-height: 0;
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
    }
  </style>
  