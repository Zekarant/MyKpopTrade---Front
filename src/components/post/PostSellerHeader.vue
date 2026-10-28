<template>
    <div class="post-modal__seller">
        <button type="button" class="post-modal__seller-link" @click="viewProfile">
            <span class="post-modal__avatar">
                <UserAvatar :user="seller" />
            </span>
            <span class="post-modal__seller-info">
                <span class="post-modal__username">
                    @{{ seller.username }}
                    <VerifiedBadge v-if="seller.isIdentityVerified" :size="14" />
                </span>
            </span>
        </button>

        <div class="post-modal__menu" @keydown.esc="closeMenu">
            <button
                ref="menuToggle"
                type="button"
                class="post-modal__actions-menu"
                aria-label="Plus d'actions"
                aria-haspopup="true"
                :aria-expanded="isMenuVisible"
                @click="isMenuVisible = !isMenuVisible"
            >
                <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
            </button>
            <div v-if="isMenuVisible" class="post-modal__dropdown">
                <button v-for="item in items" :key="item.action" type="button" @click="select(item.action)">
                    <i class="bi" :class="item.icon" aria-hidden="true"></i> {{ item.label }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/** En-tête de la fiche : vendeur (lien vers son profil) et menu « ⋮ ». */
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import UserAvatar from '@/components/UserAvatar.vue';
import VerifiedBadge from '@/components/VerifiedBadge.vue';
import type { PostMenuAction, PostSeller } from './types';

const props = defineProps<{
    seller: PostSeller;
    /** Vendeur connecté (ou fiche ouverte depuis son propre profil). */
    isOwner: boolean;
    isSold?: boolean;
    isWithdrawn?: boolean;
}>();

const emit = defineEmits<{ action: [action: PostMenuAction] }>();

const router = useRouter();
const isMenuVisible = ref(false);
const menuToggle = ref<HTMLButtonElement | null>(null);

const items = computed(() => {
    const all: { action: PostMenuAction; label: string; icon: string; visible: boolean }[] = [
        { action: 'copy', label: 'Copier le lien', icon: 'bi-link-45deg', visible: true },
        { action: 'report', label: 'Signaler', icon: 'bi-flag', visible: !props.isOwner },
        { action: 'sold', label: 'Vendu', icon: 'bi-cart-check', visible: props.isOwner && !props.isSold },
        { action: 'relist', label: 'Remettre en vente', icon: 'bi-arrow-counterclockwise', visible: props.isOwner && Boolean(props.isWithdrawn) },
        { action: 'delete', label: 'Supprimer', icon: 'bi-trash', visible: props.isOwner },
        { action: 'edit', label: 'Modifier', icon: 'bi-pencil', visible: props.isOwner },
    ];
    return all.filter((item) => item.visible);
});

function viewProfile() {
    router.push({ name: 'profile', params: { id: props.seller.username } });
}

function closeMenu() {
    isMenuVisible.value = false;
    menuToggle.value?.focus();
}

function select(action: PostMenuAction) {
    // Le focus revient sur « ⋮ » avant l'ouverture d'une confirmation : c'est là
    // qu'elle le rendra en se fermant, l'entrée du menu ayant disparu.
    closeMenu();
    emit('action', action);
}
</script>
