<template>
    <div class="content">
        <div class="row h-100">
            <div class="col-0 col-md-2"></div>
            <div class="col-12 col-md-8">
                <div class="segment-tabs w-100" role="group" aria-label="Navigation profile">
                    <button type="button" :class="{ clicked: part === 'post' }" class="segment-tab" @click="btnClick('post')">Posts</button>
                    <button type="button" :class="{ clicked: part === 'annoucement' }" class="segment-tab" @click="btnClick('annoucement')">Annonces</button>
                    <button type="button" :class="{ clicked: part === 'about' }" class="segment-tab" @click="btnClick('about')">À propos</button>
                    <button type="button" :class="{ clicked: part === 'review' }" class="segment-tab" @click="btnClick('review')">Avis</button>
                    <button type="button" :class="{ clicked: part === 'followers' }" class="segment-tab" @click="btnClick('followers')">Abonnés</button>
                    <button type="button" :class="{ clicked: part === 'wishlist' }" class="segment-tab" @click="btnClick('wishlist')">Wishlist</button>
                </div>
            </div>
            <div class="col-0 col-md-2"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';

    defineOptions({ name: 'SegmentProfil' });

    const emit = defineEmits<{ partDisplayed: [part: string] }>();

    const part = ref('post');

    function btnClick(key: string) {
        part.value = key;
        emit('partDisplayed', key);
    }
</script>

<style lang="scss" scoped>
// Onglets du profil : pas des boutons d'action, donc ni `.btn` ni `.btn-group`.
.segment-tabs{
    display: inline-flex;
}
.segment-tab{
    flex: 1 1 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: transparent;
    color: var(--bs-body-color);
    border: none;
    border-radius: 0px;
    cursor: pointer;
    font-family: "Sora", serif;
    font-size: small;
    font-weight: 400;
    line-height: 12.6px;
    text-align: center;
    white-space: nowrap;
    transition: all var(--transition-base);
}
.segment-tab:hover{
    border-bottom: 2px solid;
    border-color: var(--accent-blue);
}
.segment-tab.clicked{
    border-bottom: 2px solid;
    border-color: var(--accent-blue);
}

@media (max-width: 768px) {
    .segment-tabs{
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 6px;
        scrollbar-width: thin;
        scrollbar-color: var(--accent-pink) var(--surface-border);
    }
    .segment-tabs::-webkit-scrollbar{
        height: 4px;
    }
    .segment-tabs::-webkit-scrollbar-track{
        background: var(--bg-tertiary);
        border-radius: 4px;
    }
    .segment-tabs::-webkit-scrollbar-thumb{
        background: var(--accent-pink);
        border-radius: 4px;
    }
    .segment-tab{
        flex: 0 0 auto;
    }
    .segment-tab.clicked{
        border-bottom: none;
        color: var(--accent-pink);
        font-weight: 600;
    }
}
</style>
