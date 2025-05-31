<template>
    <div class="container_detail_card">
        <div class="card">
            <div class="review_card_content">
                <div class="review_card_content_header">
                    <div class="picture_profile_review">
                        <img :src="review.reviewer.profilePicture" alt="Profile Picture" />
                    </div>
                    <div class="reviewer_username">
                        <span>@{{ review.reviewer.username }}</span>

                    </div>
                </div>
            </div>
            <div class="illustration">
                <ImageCarousel :images="review.images" />
            </div>
        </div>
    </div>

</template>
  
  <script lang="ts">
    import ImageCarousel from '../components/ImageCarousel.vue';

    export default {

        name: "review_card",
        components: {
            ImageCarousel
        },
        props: {
            review: {
                type: Object,
                required: true,
            },
        },
    };

  </script>
  
  <style lang="scss" scoped>
    .review_card_content{
        height: 100%;
        width: 50%;
        flex-direction: column; 
        display: flex;
        justify-content: space-between;
        overflow-x: scroll;
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
    .picture_profile_review{
        height: 58px;
        width: 58px;
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
    }
  </style>
  