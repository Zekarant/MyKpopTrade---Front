<template>
    <div class="content">
        <div class="background"></div>
        <div class="picture"></div>
        <div class="profil">
            <div class="row row_profil" style="height: 100%; ">
                <div class="empty_box"></div>
                <div class="row row_name">
                    <div class="container_nickname col-md-4">
                        <div class="nickname">
                            <div class="nickname_block">
                                <span class="nickname_text_field">Surnom</span>
                            </div>
                            <div class="img_certif_container">
                                <img src="@/assets/images/certif.svg">
                            </div>
                        </div>
                        <div class="identifier">@nom_d_utilisateur</div>
                    </div>
                    <div class="container_infos col-md-6">
                        <div class="row">
                            <div class="col-md-5 subscription">
                                <span class="bold">00</span> Abonnements
                            </div>
                            <div class="col-md-5 subscription">
                                <span class="bold">00</span> Abonnés

                            </div>
                            <div class="col-md-1 more_content">
                                <i class="bi bi-three-dots-vertical"></i>                            
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
</template>


<script lang="ts">
    import { useRoute, useRouter } from "vue-router";

    export default {
        name: "banner",
        data() {
            return {
                isYouProfil: false
            };
        },
        setup() {
            const route = useRoute();
            const router = useRouter();

            return {
                route,
                router,
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
        width: 100%;
        padding-top: calc(calc(130px + 5%) / 2);
    }
    .row_profil{
        height: auto !important;
    }
    .row_name{
        width: 100%;
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