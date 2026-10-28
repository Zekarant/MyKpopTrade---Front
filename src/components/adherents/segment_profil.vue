<template>
    <div class="content">
        <div class="row h-100">
            <div class="col-0 col-md-2"></div>
            <div class="col-12 col-md-8">
                <div class="btn-group w-100" role="group" aria-label="Navigation profile">
                    <button type="button" :class="{ clicked: part === 'post' }" class="btn" @click="btnClick('post')">Posts</button>
                    <button type="button" :class="{ clicked: part === 'annoucement' }" class="btn" @click="btnClick('annoucement')">Annonces</button>
                    <button type="button" :class="{ clicked: part === 'about' }" class="btn" @click="btnClick('about')">À propos</button>
                    <button type="button" :class="{ clicked: part === 'review' }" class="btn" @click="btnClick('review')">Avis</button>
                    <button type="button" :class="{ clicked: part === 'followers' }" class="btn" @click="btnClick('followers')">Abonnés</button>
                    <button type="button" :class="{ clicked: part === 'wishlist' }" class="btn" @click="btnClick('wishlist')">Wishlist</button>
                </div>
            </div>
            <div class="col-0 col-md-2"></div>
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        name: "SegmentProfil",
        emits: ['partDisplayed'],
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
                this.$emit('partDisplayed', key);
            }
        }
    };
</script>

<style lang="scss" scoped>
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
}
.btn:hover{
    border-bottom: 2px solid;
    border-color: var(--blue);
}
.btn.clicked{
    border-bottom: 2px solid;
    border-color: var(--blue);
}

@media (max-width: 768px) {
    .btn-group{
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 6px;
        scrollbar-width: thin;
        scrollbar-color: var(--accent-pink) var(--secondary-color-tint);
    }
    .btn-group::-webkit-scrollbar{
        height: 4px;
    }
    .btn-group::-webkit-scrollbar-track{
        background: var(--secondary-color-tint);
        border-radius: 4px;
    }
    .btn-group::-webkit-scrollbar-thumb{
        background: var(--accent-pink);
        border-radius: 4px;
    }
    .btn-group .btn{
        flex: 0 0 auto;
        white-space: nowrap;
    }
    .btn.clicked{
        border-bottom: none;
        color: var(--accent-pink);
        font-weight: 600;
    }
}
</style>
