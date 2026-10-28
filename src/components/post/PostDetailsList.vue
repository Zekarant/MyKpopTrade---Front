<template>
    <dl class="post-modal__details">
        <div v-for="detail in details" :key="detail.label" class="post-modal__detail-item">
            <dt class="post-modal__detail-label">{{ detail.label }}</dt>
            <dd class="post-modal__detail-value">
                <router-link v-if="detail.to" :to="detail.to" class="post-modal__detail-link">{{ detail.value }}</router-link>
                <template v-else>{{ detail.value }}</template>
            </dd>
        </div>
    </dl>

    <div v-if="post.shippingOptions" :title="`${post.shippingPrice} €`" class="post-modal__shipping">
        <span class="post-modal__detail-label">Livraison</span>
        <div class="post-modal__shipping-tags">
            <span v-if="post.shippingOptions.worldwide" class="post-modal__tag">
                <i class="bi bi-globe" aria-hidden="true"></i> Mondiale
            </span>
            <span v-if="post.shippingOptions.nationalOnly" class="post-modal__tag">
                <i class="bi bi-geo-alt" aria-hidden="true"></i> Nationale
            </span>
            <span v-if="post.shippingOptions.localPickup" class="post-modal__tag">
                <i class="bi bi-hand-index" aria-hidden="true"></i> Main propre
            </span>
        </div>
    </div>

    <div class="post-modal__type">
        <span class="post-modal__type-badge">{{ capitalize(post.type) }}</span>
    </div>
</template>

<script setup lang="ts">
/** Caractéristiques de l'annonce : état, catalogue K-pop, livraison et type. */
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ProductDetail } from '@/types/post.types';

const props = defineProps<{ post: ProductDetail }>();

interface Detail {
    label: string;
    value: string;
    /** Groupe et album renvoient vers leur page catalogue quand l'annonce y est rattachée. */
    to?: RouteLocationRaw;
}

const capitalize = (text?: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

const details = computed<Detail[]>(() => {
    const p = props.post;
    const rows: (Detail | false)[] = [
        Boolean(p.condition) && { label: 'État', value: capitalize(p.condition) },
        Boolean(p.category) && { label: 'Catégorie', value: p.category },
        Boolean(p.kpopGroupName) && {
            label: 'Groupe',
            value: p.kpopGroupName!,
            to: p.kpopGroupId ? { name: 'group', params: { id: p.kpopGroupId } } : undefined,
        },
        Boolean(p.kpopMember) && { label: 'Membre', value: p.kpopMember! },
        Boolean(p.albumNameStr) && {
            label: 'Album',
            value: p.albumNameStr!,
            to: p.albumId ? { name: 'album', params: { id: p.albumId } } : undefined,
        },
        Boolean(p.version) && { label: 'Version', value: p.version! },
        Boolean(p.era) && { label: 'Ère', value: p.era! },
        Boolean(p.pob) && { label: 'POB', value: p.pob! },
        typeof p.isOfficial === 'boolean' && { label: 'Authenticité', value: p.isOfficial ? 'Officiel' : 'Non officiel' },
    ];
    return rows.filter((row): row is Detail => Boolean(row));
});
</script>
