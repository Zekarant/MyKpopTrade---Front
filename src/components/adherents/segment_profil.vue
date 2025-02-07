<template>
    <div class="content">
        <div class="row" style="height: 100%; ">
            <div class="col-0 col-md-2"></div>
            <div class="col-12 col-md-8">
                <div class="btn-group" role="group" aria-label="Basic example">
                    <button type="button" :class="{ clicked: part === 'post' }" @click="btnClick('post')"   class="btn">Posts</button>
                    <button type="button" :class="{ clicked: part === 'annoucement' }" @click="btnClick('annoucement')"  class="btn ">Annonces</button>
                    <button type="button" :class="{ clicked: part === 'about' }" @click="btnClick('about')"  class="btn ">À propos</button>
                    <button type="button" :class="{ clicked: part === 'review' }" @click="btnClick('review')"  class="btn ">Avis</button>
                    <button type="button" :class="{ clicked: part === 'wishlist' }" @click="btnClick('wishlist')"  class="btn ">Wishlist</button>

                </div>
            </div>
            <div class="col-0 col-md-2"></div>

        </div>

    </div>
</template>


<script lang="ts">


    export default {
        name: "segment_profil",
        data() {
            return {
                part: 'post'
            };
        },
        mounted() {
        },
        methods: {
            btnClick(key: string) {
                this.part = key;
                // On émet un événement "boutonCliqué" avec le bouton cliqué comme payload
                this.$emit('partDisplayed', key);
            }
        }

    };

</script>
<style lang="scss" scoped>
.content{
    
}
.btn{
    border: none;
    border-radius: 0px;
    font-family: "Sora", serif;
    font-size: small;
    font-weight: 400;
    line-height: 12.6px;
    text-align: center;
}
.btn-group{
    border-radius: 0px;
    width: 100%;
}
.btn:hover{
    border-bottom: 2px solid ;
    border-color: var(--blue);
}
.btn.clicked{
    border-bottom: 2px solid ;
    border-color: var(--blue);
}
</style>