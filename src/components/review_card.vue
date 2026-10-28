<template v-if="!review.isHidden">
    <div v-bind="$attrs" class="review-card" @click="closeMenu">
        <div class="review-card__date">Posté le {{ formatDate(review.createdAt, 'long') }}</div>
        <div class="review-card__body">
            <div class="review-card__content">
                <div class="review-card__header">
                    <div class="review-card__avatar">
                        <img :src="mediaUrl(review.reviewer.profilePicture)" :alt="`Avatar de ${review.reviewer.username}`" width="44" height="44" loading="lazy" decoding="async" @error="onImgError($event)" />
                    </div>
                    <div class="review-card__user">
                        <span class="review-card__username">@{{ review.reviewer.username }}</span>
                        <div class="review-card__stars">
                            <i v-for="n in 5" :key="n" class="bi" :class="n <= review.rating ? 'bi-star-fill' : 'bi-star'" ></i>
                            <span class="review-card__rating-num">{{ review.rating }}/5</span>
                        </div>
                    </div>
                    <button class="review-card__menu-btn" @click="toggleMenu($event)">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <div v-if="isMenuVisible" class="review-card__dropdown">
                        <button class="review-card__dropdown-item" @click="showPopupReport = true">
                            <i class="bi bi-flag"></i> Signaler
                        </button>
                    </div>
                </div>
                <div class="review-card__text">
                    <p>{{ review.review }}</p>
                </div>
            </div>
            <div v-if="review.images && review.images.length > 0" class="review-card__images">
                <ImageCarousel :images="review.images" />
            </div>
        </div>
    </div>
    <report_card v-if="showPopupReport" :id="review._id" :type="'rating'" @close-report="showPopupReport = false"></report_card>
</template>

  <script setup lang="ts">
    import { ref } from 'vue';
    import ImageCarousel from '../components/ImageCarousel.vue';
    import report_card from '../components/report_card.vue';
    import { formatDate, mediaUrl } from '@/utils/format';

    defineOptions({ name: 'ReviewCard', inheritAttrs: false });

    /** Champs de l'avis lus par la carte. */
    interface DisplayedReview {
        _id: string;
        isHidden?: boolean;
        createdAt: string;
        rating: number;
        review: string;
        reviewer: { username: string; profilePicture?: string };
        images?: string[];
    }

    defineProps<{ review: DisplayedReview }>();

    const isMenuVisible = ref(false);
    const showPopupReport = ref(false);

    function toggleMenu(event: MouseEvent) {
        event.stopPropagation();
        isMenuVisible.value = !isMenuVisible.value;
    }

    function closeMenu() {
        isMenuVisible.value = false;
    }

    function onImgError(event: Event) {
        const img = event.target as HTMLImageElement;
        img.style.display = 'none';
        if (img.parentElement) {
            img.parentElement.classList.add('review-card__avatar--fallback');
        }
    }
  </script>

  <style lang="scss" scoped>
.review-card {
    background: var(--bg-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: box-shadow var(--transition-fast);
    &:hover { box-shadow: var(--shadow-md); }
}
.review-card__date {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    border-bottom: 1px solid var(--surface-border);
}
.review-card__body {
    display: flex;
    min-height: 160px;
}
.review-card__content {
    flex: 1;
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-width: 0;
}
.review-card__header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    position: relative;
}
.review-card__avatar {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--accent-gradient);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    img { width: 100%; height: 100%; object-fit: cover; }
    &--fallback::after {
        content: '\F4DA';
        font-family: 'bootstrap-icons';
        color: white;
        font-size: 1.2rem;
    }
}
.review-card__user { flex: 1; min-width: 0; }
.review-card__username {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
}
.review-card__stars {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 2px;
    i { font-size: 0.75rem; color: #FFD485; }
}
.review-card__rating-num {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-left: 6px;
}
.review-card__menu-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    &:hover { background: var(--surface-hover); }
}
.review-card__dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 10;
    overflow: hidden;
}
.review-card__dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 8px 16px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    &:hover { background: var(--surface-hover); color: var(--danger); }
}
.review-card__text {
    flex: 1;
    p {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
        word-break: break-word;
    }
}
.review-card__images {
    width: 200px;
    flex-shrink: 0;
    background: var(--bg-tertiary);
    border-left: 1px solid var(--surface-border);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
@media (max-width: 768px) {
    .review-card__body { flex-direction: column-reverse; }
    .review-card__images {
        width: 100%;
        height: 160px;
        border-left: none;
        border-bottom: 1px solid var(--surface-border);
    }
}
  </style>
